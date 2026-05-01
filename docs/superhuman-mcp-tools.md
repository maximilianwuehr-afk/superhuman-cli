# Superhuman MCP Tool Inventory

Generated from the live Superhuman Mail MCP `tools/list` response.

## create_or_update_draft

Compose an email on behalf of the user. Uses the user's writing style, tone, and personalization to produce a polished draft. Returns the composed email — use send_draft separately to send it. The draft is saved to the user's Superhuman Mail Drafts list. The response includes a draft object with draft_id and thread_id — pass draft_id to send_draft to send the email. To update an existing draft (e.g. after user feedback), pass the previous draft_id and thread_id — the existing draft's content (recipients, subject, body) is loaded so the writer can revise it based on your instructions rather than composing from scratch. The draft will be updated in place instead of creating a duplicate. Forward drafts are a temporary exception: use body, not instructions, and provide only your intro text — the server appends the forwarded message automatically.

| Parameter | Required | Schema |
| --- | --- | --- |
| `bcc` | no | `{"description":"BCC recipients (name or email).","items":{"type":"string"},"type":"array"}` |
| `body` | no | `{"description":"Email body in HTML format. Use this as a fallback to directly create a draft with the exact text provided, bypassing the AI writer. When body is provided, the draft is saved as-is without style or tone adjustments. Prefer instructions over body for a polished result, except for forward drafts where body is required and should contain only your intro text.","type":"string"}` |
| `cc` | no | `{"description":"CC recipients (name or email).","items":{"type":"string"},"type":"array"}` |
| `draft_id` | no | `{"description":"Draft ID from a previous create_or_update_draft response. When provided with thread_id, the existing draft's content is loaded as context for revision and the draft is updated in place instead of creating a new one.","type":"string"}` |
| `from` | no | `{"description":"Email address to send from. Must be one of the user's verified aliases. When omitted, reply drafts prefer the alias that matches the original message and otherwise fall back to the default send-as alias. When updating an existing draft, the previously set from address is preserved if omitted.","type":"string"}` |
| `instructions` | no | `{"description":"What the email should say or accomplish — e.g. 'thank Sarah for the update and ask about next steps'. This is the preferred way to compose emails: the tool uses the user's writing style, tone, and personalization to produce a polished draft. Either instructions or body must be provided. Forward drafts do not support instructions; use body instead.","type":"string"}` |
| `message_id` | no | `{"description":"Message ID within a thread to reply to. When omitted, replies to the last message in the thread.","type":"string"}` |
| `subject` | no | `{"description":"Email subject line (optional — will be auto-generated if not provided)","type":"string"}` |
| `thread_id` | no | `{"description":"Thread ID for replies/forwards, or the draft's thread_id when updating an existing draft.","type":"string"}` |
| `to` | no | `{"description":"Recipients (name or email). Auto-resolved if omitted.","items":{"type":"string"},"type":"array"}` |
| `type` | yes | `{"description":"The kind of email to compose.","enum":["new","forward","reply","reply_all"],"type":"string"}` |

## create_or_update_event

Create a new calendar event or edit an existing one. If event_id is provided, updates the existing event. Otherwise creates a new event. Note: newly created or updated events may take up to a minute to appear in search and query results.

| Parameter | Required | Schema |
| --- | --- | --- |
| `attendees` | no | `{"description":"List of attendee email addresses","items":{"type":"string"},"type":"array"}` |
| `calendar_id` | no | `{"description":"Calendar ID (defaults to primary calendar)","type":"string"}` |
| `conference` | no | `{"description":"Whether to add a video meeting link","type":"boolean"}` |
| `description` | no | `{"description":"Event description (HTML supported)","type":"string"}` |
| `end` | yes | `{"description":"End time in RFC3339 format (e.g. 2024-03-15T10:00:00-07:00)","type":"string"}` |
| `event_id` | no | `{"description":"The event ID to update (omit to create a new event)","type":"string"}` |
| `is_all_day` | no | `{"description":"Whether this is an all-day event","type":"boolean"}` |
| `location` | no | `{"description":"Event location","type":"string"}` |
| `recurrence` | no | `{"description":"RRULE recurrence string (e.g. RRULE:FREQ=WEEKLY;COUNT=10)","type":"string"}` |
| `reminders` | no | `{"description":"Custom reminders for the event. Each reminder specifies a method (email or popup) and how many minutes before the event to trigger.","items":{"properties":{"method":{"description":"Reminder method: email or popup","type":"string"},"minutes":{"description":"Minutes before the event to send the reminder","type":"integer"}},"required":["method","minutes"],"type":"object"},"type":"array"}` |
| `start` | yes | `{"description":"Start time in RFC3339 format (e.g. 2024-03-15T09:00:00-07:00)","type":"string"}` |
| `timezone` | yes | `{"description":"IANA timezone name (e.g. America/New_York)","type":"string"}` |
| `title` | yes | `{"description":"Event title","type":"string"}` |

## discard_draft

Discard a user-owned Superhuman Mail draft by draft_id so it disappears from the user's Drafts list.

| Parameter | Required | Schema |
| --- | --- | --- |
| `draft_id` | yes | `{"description":"Draft ID returned by draft_email.","type":"string"}` |

## get_attachment

Retrieve email attachments. For images and audio files, returns both the file content (for direct processing) and a download URL. For other file types, returns a download URL only. Download URLs expire after 1 hour. Requires a message_id obtained from get_message or get_thread.

| Parameter | Required | Schema |
| --- | --- | --- |
| `attachment_name` | no | `{"description":"Optional: only return attachments matching this exact filename, otherwise returns all message attachments.","type":"string"}` |
| `message_id` | yes | `{"description":"The message ID containing attachments.","type":"string"}` |

## get_availability

Find available meeting times for a group of participants. Resolves names to emails, checks availability, and returns proposed time slots. Use create_or_update_event afterward to create the meeting.

| Parameter | Required | Schema |
| --- | --- | --- |
| `duration_minutes` | no | `{"description":"Desired meeting duration in minutes. Default: 30.","type":"number"}` |
| `end_date` | yes | `{"description":"End of the time window to search in RFC3339 format (e.g. 2026-04-07T23:59:59-07:00).","type":"string"}` |
| `participants` | yes | `{"description":"Email addresses of participants to find availability for.","items":{"type":"string"},"type":"array"}` |
| `start_date` | yes | `{"description":"Start of the time window to search in RFC3339 format (e.g. 2026-04-01T00:00:00-07:00).","type":"string"}` |
| `timezone` | no | `{"description":"IANA timezone name (e.g. America/New_York). Defaults to the user's timezone.","type":"string"}` |
| `working_hours_only` | no | `{"description":"Only return slots during business hours (9am–5pm in the user's timezone). Default: true.","type":"boolean"}` |

## get_message

Fetch a single email message by its message ID. Returns full message details including body text. Use include_raw_html to also retrieve the original HTML. Requires a message_id obtained from list_email or get_thread.

| Parameter | Required | Schema |
| --- | --- | --- |
| `include_raw_html` | no | `{"description":"When true, includes the raw HTML body. Defaults to false.","type":"boolean"}` |
| `message_id` | yes | `{"description":"The message ID to fetch.","type":"string"}` |

## get_read_status_feed

Get a feed of read receipts for emails you've sent — who opened them, when, and on what device. Returns events newest first. By default scans the last 14 days of sent mail (up to 500 messages) and returns read events from the last 24 hours.

| Parameter | Required | Schema |
| --- | --- | --- |
| `cursor` | no | `{"description":"Opaque pagination cursor from a previous response's next_cursor.","type":"string"}` |
| `limit` | no | `{"description":"Max events to return (default 50, max 200).","type":"integer"}` |
| `since` | no | `{"description":"ISO 8601 datetime. Only reads that occurred at or after this time are returned. Defaults to 24 hours ago.","type":"string"}` |
| `thread_id` | no | `{"description":"If set, returns read events for the most recent message you sent in this thread instead of the cross-thread feed.","type":"string"}` |

## get_thread

Fetch a specific email thread by its thread ID. Returns structured message data including bodies, recipients, and attachments. Requires a thread_id obtained from query_email_and_calendar or list_threads.

| Parameter | Required | Schema |
| --- | --- | --- |
| `include_comments` | no | `{"description":"Whether to include comments on the thread (default false).","type":"boolean"}` |
| `include_drafts` | no | `{"description":"Whether to include draft messages (default true).","type":"boolean"}` |
| `message_limit` | no | `{"description":"Max messages to return (default 50, max 100). When the thread is longer, the first message (thread root) and the newest message_limit-1 messages are returned; middle messages are dropped.","type":"integer"}` |
| `thread_id` | yes | `{"description":"The thread ID to fetch.","type":"string"}` |

## list_labels

List all labels available on the user's email account. Returns user-created labels that can be used with list_threads (labels filter) and update_thread (add_labels / remove_labels).

Parameters: none

## list_splits

List the user's inbox splits. Splits organize the inbox into sections like Important, Other, and user-created categories (VIP, News, Team, etc.). Returns each split's name, filter criteria, and thread/unread counts. Use split names with the list_threads tool's split filter to view threads in a specific split. Note: counts reflect the last mailbox sync and may be a few seconds behind.

Parameters: none

## list_threads

Search email threads with structured filters. Returns thread metadata with participants, labels, and a snippet of the latest message. Supports pagination for large result sets. No filters returns the most recent threads. Note: recently sent or received messages may take up to a minute to appear in results.

| Parameter | Required | Schema |
| --- | --- | --- |
| `body_contains` | no | `{"description":"Filter by body substring, case-insensitive.","type":"string"}` |
| `cursor` | no | `{"description":"Opaque pagination cursor from a previous response's next_cursor.","type":"string"}` |
| `end_date` | no | `{"description":"Threads with messages on or before this date. ISO 8601 format.","type":"string"}` |
| `from` | no | `{"description":"Filter by sender email addresses, case-insensitive substring match (OR logic).","items":{"type":"string"},"type":"array"}` |
| `has_attachment` | no | `{"description":"Filter to threads containing messages with attachments.","type":"boolean"}` |
| `is_starred` | no | `{"description":"Filter to starred threads (true) or unstarred threads (false).","type":"boolean"}` |
| `is_unread` | no | `{"description":"Filter to unread threads (true) or read threads (false).","type":"boolean"}` |
| `labels` | no | `{"description":"Filter by labels (OR logic). Includes system labels like UNREAD, STARRED, INBOX, SENT, DRAFT. Use list_labels to discover available user-created labels.","items":{"type":"string"},"type":"array"}` |
| `limit` | no | `{"description":"Max threads to return (default 25, max 50).","type":"integer"}` |
| `split` | no | `{"description":"Filter to threads belonging to a specific split. Accepts a split name (e.g., 'Important', 'Other', 'GitHub', case-insensitive) or ID from list_splits. When set, threads are retrieved from the pre-computed split membership rather than searching the email provider. Results reflect the last mailbox sync and may be a few seconds behind.","type":"string"}` |
| `start_date` | no | `{"description":"Threads with messages on or after this date. ISO 8601 format (e.g., '2024-01-01' or '2024-01-01T00:00:00Z').","type":"string"}` |
| `subject_contains` | no | `{"description":"Filter by subject substring, case-insensitive.","type":"string"}` |
| `to` | no | `{"description":"Filter by recipient email addresses in to/cc/bcc, case-insensitive substring match (OR logic).","items":{"type":"string"},"type":"array"}` |

## mark_spam

Mark an email thread as spam by thread ID. When also_block_sender or also_block_domain is set, the sender or domain is blocked and a bulk action runs in the background to mark all existing inbox threads from that sender or domain as spam.

| Parameter | Required | Schema |
| --- | --- | --- |
| `also_block_domain` | no | `{"description":"When true, block the sender's entire domain instead of just the email address, and mark all existing inbox threads from that domain as spam in the background. Defaults to false.","type":"boolean"}` |
| `also_block_sender` | no | `{"description":"When true, also block the sender and mark all their existing inbox threads as spam in the background. Defaults to false.","type":"boolean"}` |
| `also_trash` | no | `{"description":"When true, also move the thread to trash after marking as spam. Defaults to false.","type":"boolean"}` |
| `thread_id` | yes | `{"description":"The thread ID to mark as spam.","type":"string"}` |

## query_email_and_calendar

Answer natural-language questions about the user's emails, calendar, contacts, and knowledge base. Best for open-ended, exploratory, or ambiguous requests — inbox triage, summarizing conversations, checking schedules, or any question that spans multiple sources. Understands context and reasons across email and calendar together. Note: recently sent emails or newly created calendar events may take up to a minute to appear in results.

| Parameter | Required | Schema |
| --- | --- | --- |
| `question` | yes | `{"description":"The question to answer — can be about emails, calendar events, contacts, or company knowledge","type":"string"}` |

## send_draft

Send an existing Superhuman Mail draft. Pass draft_id from create_or_update_draft. Optionally use smart_send to schedule at the best engagement time, send_at to schedule at a specific time, or undo_timeout to delay sending by up to 10 minutes so the send can be cancelled via undo_send. When no scheduling option is provided, send_draft applies a default 1-minute undo-send delay. Note: after sending, the message may take up to a minute to appear in search results or thread listings.

| Parameter | Required | Schema |
| --- | --- | --- |
| `draft_id` | yes | `{"description":"Draft ID returned by create_or_update_draft.","type":"string"}` |
| `send_at` | no | `{"description":"RFC3339 datetime to schedule the send. Must be in the future. Mutually exclusive with smart_send and undo_timeout.","type":"string"}` |
| `smart_send` | no | `{"description":"When true, schedules the email at the optimal send time based on recipient engagement data. Mutually exclusive with send_at and undo_timeout.","type":"boolean"}` |
| `undo_timeout` | no | `{"description":"Number of minutes (1–10) to delay the send, allowing cancellation via undo_send. Returns undo_token and undo_expires_at. When omitted, send_draft uses the default 1-minute undo-send delay. Mutually exclusive with smart_send and send_at.","maximum":10,"minimum":1,"type":"integer"}` |

## trash_thread

Move an email thread to trash by thread ID. This is a destructive operation, the thread will be removed from the inbox and placed in the trash folder.

| Parameter | Required | Schema |
| --- | --- | --- |
| `thread_id` | no | `{"description":"The thread ID to trash.","type":"string"}` |

## undo_send

Cancel a recently queued send while still within the undo window. Use the undo_token returned by send_draft (preferred), or the message_id from send_draft as a fallback. The draft remains in the Drafts list either way.

| Parameter | Required | Schema |
| --- | --- | --- |
| `message_id` | no | `{"description":"message_id returned by send_draft. Alternative to undo_token when the token is unavailable.","type":"string"}` |
| `undo_token` | no | `{"description":"Token returned by send_draft when undo_timeout was set. Cancels the send.","type":"string"}` |

## unsubscribe

Unsubscribe from a mailing list by thread ID based on the List-Unsubscribe header of the latest message in the thread. Optionally trash the thread and/or block the sender.

| Parameter | Required | Schema |
| --- | --- | --- |
| `also_block` | no | `{"description":"When true, also block the sender. Defaults to false.","type":"boolean"}` |
| `also_domain` | no | `{"description":"When true and also_block is true, block the sender's entire domain instead of just the email address.","type":"boolean"}` |
| `also_trash` | no | `{"description":"When true, also trash the thread. Defaults to false.","type":"boolean"}` |
| `thread_id` | yes | `{"description":"The email thread ID to unsubscribe from.","type":"string"}` |

## update_personalization

Update the user's personalization based on natural language feedback. Use this when the user wants to correct their writing style, update personal facts, change greeting/sign-off preferences, or adjust any personalization setting.

| Parameter | Required | Schema |
| --- | --- | --- |
| `feedback` | yes | `{"description":"The user's feedback — e.g. 'I prefer casual greetings like Hey instead of Dear', 'My title is now VP of Engineering', 'I like shorter emails'","type":"string"}` |

## update_thread

Update an email thread: mark done/not done, star/unstar, read/unread, move between Important and Other, add or remove labels, or move to a folder. Multiple changes can be made in a single call.

| Parameter | Required | Schema |
| --- | --- | --- |
| `add_labels` | no | `{"description":"Labels to add to the thread. Use list_labels to discover available labels.","items":{"type":"string"},"type":"array"}` |
| `last_message_id` | yes | `{"description":"The ID of the last message in the thread (used for consistency checks)","type":"string"}` |
| `mark_done` | no | `{"description":"Set to true to archive/mark done, false to move back to inbox","type":"boolean"}` |
| `mark_important` | no | `{"description":"Set to true to move the thread to Important (Gmail) / Focused (Microsoft), false to move to Other. On Gmail, honors the user's Restrictive Important setting.","type":"boolean"}` |
| `mark_read` | no | `{"description":"Set to true to mark as read, false to mark as unread","type":"boolean"}` |
| `mark_starred` | no | `{"description":"Set to true to star, false to unstar","type":"boolean"}` |
| `move_to_folder` | no | `{"description":"Folder to move the thread to","type":"string"}` |
| `remove_labels` | no | `{"description":"Labels to remove from the thread. Use list_labels to discover available labels.","items":{"type":"string"},"type":"array"}` |
| `thread_id` | yes | `{"description":"The email thread ID to update","type":"string"}` |

