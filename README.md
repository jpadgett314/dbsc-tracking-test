# WIP

I created this experiment because I was concerned about Device-Bound Session Credentials (DBSC) being used for device fingerprinting. 

Conclusion: no, Google has not given every website freedom to track your device. 

For DBSC, the browser must only prove that your device is the same device that the session was created on. This doesn't require the existence of any global hardware ID, much less a public one.

For DBSC, the browser provides the following information:
 - Signed challenges
 - A public key for verifying challenges
 - Partipation in the session negotiation itself (requests, session id etc)

The signed challenges and public key aren't useful for fingerprinting as long as they do not outlive the session. The corresponding private key is not accessible; I assume that the private key also has the same lifetime as the session.

In practice, device-bound sessions are not persisted across websites, across users, in incognito mode or after clearing cookies. The browser can simply end the session and never re-use the same private key again. From what I can tell, these sessions aren't more trackable than cookie-based sessions.

Of course, the enablement of the feature itself (has this client disabled DBSC?) could form part of a fingerprint, in theory. Chrome users who disable the feature may unwittingly add uniqueness to their fingerprint.
