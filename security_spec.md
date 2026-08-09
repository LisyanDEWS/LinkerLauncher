# Security Specification for LinkerRu :Re

## Data Invariants
1. **User Profiles (`/users/{userId}`)**:
   - Strictly owned by the user with the matching `uid`.
   - Creation requires `uid`, `nickname`, and `email`.
   - `updatedAt` must be a server timestamp.
   - Users cannot modify their `uid` or `email` after creation (email is usually managed by Auth, but we track it here). Actually, let's allow updating nickname and settings.
2. **P2P Rooms (`/connectRooms/{roomId}`)**:
   - Rooms are used for WebRTC signaling.
   - Any authenticated user can create a room.
   - Rooms expire (tracked via `timestamp`).
   - `offer`, `answer`, `hostCandidates`, `guestCandidates` are the primary signaling fields.
   - Candidates lists are strictly bounded to prevent resource exhaustion.

## The "Dirty Dozen" Payloads
1. **[Identity Spoofing]**: Attempt to create `users/victim_uid` with `request.auth.uid = attacker_uid`.
2. **[Shadow Update]**: Attempt to update `users/my_uid` with `isAdmin: true`.
3. **[PII Leak]**: Attempt to `get` `users/victim_uid` as a different authenticated user.
4. **[Resource Poisoning]**: Attempt to create `connectRooms/room1` with an `offer.sdp` string > 50KB.
5. **[State Shortcutting]**: Attempt to update `connectRooms/room1` and set `connected: true` without a valid `answer`. (Hard to enforce perfectly in rules without complex logic, but we can check field presence).
6. **[Identity Integrity]**: Attempt to update `users/my_uid` and change the `uid` field to a different string.
7. **[Resource Exhaustion]**: Attempt to add 5000 ICE candidates to `guestCandidates` array.
8. **[ID Poisoning]**: Attempt to create a room with ID `../invalid/path`.
9. **[Temporal Integrity]**: Attempt to create a user with `updatedAt` set to 1 year in the future.
10. **[PII Blanket Test]**: Attempt to `list` the `/users` collection.
11. **[Schema Integrity]**: Attempt to create a user without the `nickname` field.
12. **[Type Safety]**: Attempt to set `settings` in `users/my_uid` to a string instead of an object.

## Security Controls (Eight Pillars)
1. **Master Gate**: All sub-resources (if any) will check parent ownership.
2. **Validation Blueprints**: `isValidUser` and `isValidConnectRoom` functions.
3. **Path Variable Hardening**: `isValidId` for all document IDs.
4. **Tiered Identity**: Owners can do everything; others (in rooms) can only add candidates/answer.
5. **Array Guarding**: Limit ICE candidates lists to 50 items.
6. **PII Isolation**: `users` documents are restricted to `isOwner()`.
7. **Atomicity**: (Not strictly applicable here as there are no multi-doc writes discovered).
8. **Secure List Queries**: `users` listing is forbidden.
