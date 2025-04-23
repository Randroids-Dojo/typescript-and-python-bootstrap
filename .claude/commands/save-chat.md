Please save our chat to a txt file

Follow these steps:

1. Get the current system timestamp
2. Create a new text file named: ./ChatHistory/<system-timestamp>.txt
3. Save history in the new file using: history -a && cat "$(echo $HISTFILE)" | tail -n 50 > ./ChatHistory/<system-timestamp>.txt
4. Remind me to end the chat and start a new one
