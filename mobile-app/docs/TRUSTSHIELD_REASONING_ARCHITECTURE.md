# TrustShield Reasoning Architecture

## 1. Overview

TrustShield AI is an on-device scam safety app for parents, grandparents, and low-digital-literacy users. It combines local extraction, rule-based evidence, a local scam playbook, and Base Gemma 4 E2B reasoning to produce an elder-friendly safety result.

Pipeline:

```text
Image / QR
-> OCR + QR extractor
-> Signal Extractor v3
-> Local Scam Playbook
-> Gemma 4 E2B
-> Safety JSON
-> Elder-friendly Result Screen
```

## 2. Extraction Layer

TrustShield uses Google ML Kit OCR for visible Latin-script text in screenshots or scanned images. It also uses ML Kit Barcode Scanner and Google Code Scanner for QR/barcode content.

OCR and QR content are merged into one local analysis input. No cloud OCR, no Tesseract, and no Gemma VLM/OCR are used.

## 3. Signal Extractor V3

Signal Extractor v3 identifies observable scam cues before model reasoning. It looks for URLs, short links, suspicious domains, OTP/PIN/password/CVV requests, payment requests, APK installation requests, reward offers, urgency, delivery fees, job fees, investment claims, QR payment patterns, and Sri Lankan English/Latin scam patterns.

It also handles local contexts such as telco offers, mobile/data rewards, Sri Lankan bank or finance wording, delivery/courier messages, and safe-looking transaction notices.

## 4. Local Scam Playbook Mini-RAG

The scam playbook is a small local-only pattern retrieval layer. It matches extracted signals and keywords to known scam patterns such as fake gift cards, bank OTP phishing, fake delivery fees, job registration fees, QR payment links, APK malware, WhatsApp code theft, government benefit scams, and telco offer scams.

This is not cloud RAG. There is no cloud database and no network retrieval.

## 5. Gemma 4 E2B Reasoning

Base Gemma 4 E2B receives compact local context:

- OCR/QR text
- detected URLs
- Signal Extractor v3 signals
- rule risk hint
- local evidence
- scam type hint
- top local scam playbook matches

Gemma makes the final contextual judgment and returns a structured safety JSON with risk level, confidence, explanation, scam identity, evidence, handling plan, warning, safe action, and family alert.

## 6. Parser And Safety Fallback

The parser repairs and normalizes model output. It tries direct JSON parsing, markdown JSON extraction, and first-object JSON extraction. Missing fields are filled from the local playbook, signal evidence, and local fallback.

Unsafe advice is filtered. TrustShield never allows advice such as clicking links, sharing OTPs or passwords, installing APKs, sending money, paying first, or replying with codes. If unsafe advice appears, it is replaced with official verification guidance.

Conservative overrides prevent unsafe downgrades. If rules and the top playbook match indicate dangerous behavior, weak safe/suspicious model output is replaced by a dangerous local fallback. If a safe transaction notice has no risky signals and the model over-escalates to dangerous, TrustShield can downgrade using the local fallback.

## 7. Privacy

TrustShield uses no cloud AI. It does not call OpenAI, Gemini API, or any PC/server fallback. Sensitive messages, screenshots, OCR text, QR content, and model reasoning stay on the device.

## 8. Why This Is Stronger Than Rules Only

Rules extract concrete evidence. They are good at spotting observable scam cues such as OTP requests, fake links, urgency, and payment instructions.

Gemma weighs the context and explains it in plain language. It can describe what the message is trying to make the user do, why that is risky, what looks safe, what should be checked, and the safest next action.
