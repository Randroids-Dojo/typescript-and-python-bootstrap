import { G as GenericEndpointContext } from './better-auth.B3qlboSE.cjs';

declare function generateState(c: GenericEndpointContext, link?: {
    email: string;
    userId: string;
}): Promise<{
    state: string;
    codeVerifier: string;
}>;
declare function parseState(c: GenericEndpointContext): Promise<{
    codeVerifier: string;
    expiresAt: number;
    callbackURL: string;
    link?: {
        email: string;
        userId: string;
    } | undefined;
    errorURL?: string | undefined;
    newUserURL?: string | undefined;
    requestSignUp?: boolean | undefined;
}>;

export { generateState as g, parseState as p };
