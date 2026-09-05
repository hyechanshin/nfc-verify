Project name: NFC Verify

Summary: A full-stack platform that authenticates physical items using NFC (NTAG424 DNA) tags with cryptographic verification, letting anyone tap a tagged item to confirm it's genuine and view its scan history.

Detailed description: Each physical item is fitted with an NTAG424 DNA NFC tag encoded with SDM (Secure Dynamic Messaging), so tapping it with any phone opens a URL containing the tag's UID, scan counter, and a cryptographic CMAC (Cipher-based Message Authentication Code). The backend validates the CMAC against a registered key, logs the scan (timestamp, counter, IP), and detects tampering or cloning attempts (e.g. a repeated/rolled-back counter). A public page shows the verification result (genuine/invalid) plus decoded tag details in both raw hex and human-readable form; an admin dashboard lets an owner register tags and review scan history.

Git Repo: https://github.com/hyechanshin/nfc-verify

Members: Hyechan Shin

Front end: React + Vite

Back end: Node.js + Express

Database: MongoDB

Definition of success: 

A user can tap a real, encoded NTAG424 tag with an unmodified phone browser and see an accurate genuine/invalid verification result within a couple seconds, with the scan recorded and visible in the admin dashboard's history for that tag.
