# KinKey verification log

Fill in **Actual** and **Evidence** only from what you observed. Leave a row "Not run" rather than guessing.
TideCloak version: ______   Date: ______   Tester: ______

| ID | Test | Expected | Actual | Evidence (screenshot / output) | Status |
|---|---|---|---|---|---|
| V1 | `mom` signs in | Name shown in header | | | |
| V2 | API without/forged token | 401 / 403 | 401 and 403 returned | Local curl run during development | Pass |
| V3 | `lan` decrypts value `mom` encrypted (`medical`) | `PASS` on Two-person check | | | |
| V4 | `lan` opens safe after demo load | Medical open, finance sealed with network error | | | |
| V5 | Approvals needed to commit a grant (4 admins) | Record count at which it commits | Committed after ___ of 4 | | |
| V6 | `lan` after committed grant | Finance opens, letter shown | | | |
| V7a | Revocation, reload + retry | Finance sealed | | | |
| V7b | Revocation, already-open tab | Note what remains visible | | | |
| V8 | `npm run check:plaintext` | `PASS` | | | |
| V9 | Bootstrap admin grants role directly | Record: committed or pending | | | |
| V10 | Single admin self-grant | Pending | | | |

After filling this in, update the *Verification status* and *Trust model* tables in the README to match.
