# Base Gemma V1 Manual Notes

Use Settings to initialize Gemma 4 E2B, select Base Gemma 4 E2B mode, then test these messages from Analyze.

| Case | Message | Expected | Manual result |
| --- | --- | --- | --- |
| 1 | Your bank account will be blocked. Send OTP now to verify. | dangerous | DONE |
| 2 | CVS Give-Away! $75 After 3 minute Survey www.GiftComps.store | dangerous or suspicious | DONE |
| 3 | Your parcel is held. Pay delivery fee using this link. | dangerous | DONE |
| 4 | Work from home. Earn Rs. 25,000 daily. Pay registration fee now. | dangerous | DONE |
| 5 | Your account was credited with LKR 25,000. Available balance updated. | safe or at least not dangerous | DONE |

OCR screenshot test notes:

| Case | OCR text appeared | Signals appeared | Result opened | Latency shown | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | DONE | DONE | DONE | DONE | DONE |
| 2 | DONE | DONE | DONE | DONE | DONE |
| 3 | DONE | DONE | DONE | DONE | DONE |
| 4 | DONE | DONE | DONE | DONE | DONE |
| 5 | DONE | DONE | DONE | DONE | DONE |

Offline/no-cloud check:

| Step | Result |
| --- | --- |
| Wi-Fi off | DONE |
| Mobile data off | DONE |
| Gemma initialized | DONE |
| Manual analysis completed | DONE |
