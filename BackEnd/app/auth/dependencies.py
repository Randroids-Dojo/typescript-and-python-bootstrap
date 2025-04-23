import logging
import os
from typing import List, Optional, Set, Union, Callable
from fastapi import Depends, HTTPException, Request
from app.middleware.auth import verify_token

logger = logging.getLogger(__name__)

def require_auth(session = Depends(verify_token)):
    """
    Dependency to require authentication
    
    Returns:
        The validated session containing user info
    """
    return session

def require_admin(session = Depends(verify_token)):
    """
    Dependency to require admin role
    
    Returns:
        The validated session if user has admin role
        
    Raises:
        HTTPException: if user lacks admin role
    """
    # Check if we're in fallback mode with limited access
    from app.auth.client import auth_client
    if getattr(auth_client, "offline_mode", False) and session.user.id == "fallback-user":
        # Check if admin access is allowed in fallback mode
        allow_admin_in_fallback = os.getenv("BETTER_AUTH_ALLOW_ADMIN_IN_FALLBACK", "false").lower() in ("true", "1", "yes", "y", "t")
        if allow_admin_in_fallback:
            logger.warning(f"Allowing admin access in fallback mode")
            return session
            
    # Normal role check
    if "admin" not in session.user.roles:
        logger.warning(f"Admin access attempt by unauthorized user: {session.user.id}")
        raise HTTPException(status_code=403, detail="Admin access required")
    return session

def require_roles(required_roles: Union[str, List[str]], any_role: bool = False):
    """
    Factory function to create a dependency requiring specific role(s)
    
    Args:
        required_roles: A single role or list of roles required
        any_role: If True, access is granted with any of the roles (OR logic)
                 If False, all roles are required (AND logic)
    
    Returns:
        A dependency function that checks for the required roles
    """
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    required_set = set(required_roles)
    
    async def _check_roles(session = Depends(verify_token)):
        # Check if we're in fallback mode with limited access
        from app.auth.client import auth_client
        if getattr(auth_client, "offline_mode", False) and session.user.id == "fallback-user":
            # Check role bypass config for fallback mode
            allow_role_bypass = os.getenv("BETTER_AUTH_ALLOW_ROLE_BYPASS", "false").lower() in ("true", "1", "yes", "y", "t")
            
            if allow_role_bypass:
                # Check if the specific roles or any role access is allowed in fallback
                bypassed_roles = os.getenv("BETTER_AUTH_BYPASSED_ROLES", "").split(",")
                if any(role in bypassed_roles for role in required_roles) or "all" in bypassed_roles:
                    logger.warning(f"Bypassing role check for {required_roles} in fallback mode")
                    return session
                    
        # Normal role check
        user_roles = set(session.user.roles)
        
        if any_role:
            # Check if user has any of the required roles
            if not required_set.intersection(user_roles):
                logger.warning(f"Access attempt with insufficient roles. User {session.user.id} has {user_roles}, needs any of {required_set}")
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Required any of the following roles: {', '.join(required_roles)}"
                )
        else:
            # Check if user has all required roles
            if not required_set.issubset(user_roles):
                missing_roles = required_set - user_roles
                logger.warning(f"Access attempt with missing roles. User {session.user.id} missing {missing_roles}")
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Missing required roles: {', '.join(missing_roles)}"
                )
        
        return session
    
    return _check_roles

def require_permissions(permission_checker: Callable, error_message: str = "Insufficient permissions"):
    """
    Factory function for complex permission checking logic
    
    Args:
        permission_checker: A callable that takes the session and request and returns
                           True if access is allowed, False otherwise
        error_message: Custom error message to display on access denial
    
    Returns:
        A dependency function that uses custom permission logic
    """
    async def _check_permissions(request: Request, session = Depends(verify_token)):
        if not permission_checker(session, request):
            logger.warning(f"Custom permission check failed for user {session.user.id}")
            raise HTTPException(status_code=403, detail=error_message)
        return session
    
    return _check_permissions

def require_mfa(session = Depends(verify_token)):
    """
    Dependency to require MFA validation for sensitive operations
    
    Returns:
        The validated session if MFA is verified
        
    Raises:
        HTTPException: if MFA is not verified
    """
    if not session.mfa_verified:
        logger.warning(f"MFA-protected resource access attempt without MFA by user {session.user.id}")
        raise HTTPException(
            status_code=403, 
            detail="Multi-factor authentication required for this resource"
        )
    return session

def resource_owner(resource_id_param: str = "id"):
    """
    Factory function to ensure user is the owner of a resource
    
    Args:
        resource_id_param: Name of the path parameter containing the resource ID
    
    Returns:
        A dependency function that checks resource ownership
    """
    async def _check_ownership(request: Request, session = Depends(verify_token)):
        resource_id = request.path_params.get(resource_id_param)
        user_id = session.user.id
        
        # Admins can access any resource
        if "admin" in session.user.roles:
            return session
        
        # Example of checking ownership - in a real app, you'd query the database
        # This is a simplified example that assumes the resource ID is the user ID
        if resource_id != user_id:
            logger.warning(f"User {user_id} attempted to access resource {resource_id} without permission")
            raise HTTPException(status_code=403, detail="Access denied - you don't own this resource")
        
        return session
    
    return _check_ownership
