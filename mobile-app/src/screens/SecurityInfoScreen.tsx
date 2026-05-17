import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, sharedStyles } from "./sharedStyles";

type ContactButton = {
  title: string;
  url: string;
};

type OfficialContact = {
  name: string;
  purpose: string;
  details: string[];
  note?: string;
  buttons: ContactButton[];
};

const quickSafetyRules = [
  "Do not click links from unknown messages.",
  "Do not share OTP, PIN, CVV, password, or WhatsApp verification code.",
  "Do not install APK files sent by message.",
  "Do not send money because of pressure, prizes, delivery fees, or urgent warnings.",
  "Take a screenshot before deleting anything.",
  "Ask a trusted family member before acting.",
  "Use official apps or official websites manually instead of message links.",
];

const alreadyClickedSteps = [
  "Call your bank or card provider immediately if money, card, or banking details are involved.",
  "Ask the bank to block or secure the card or account if needed.",
  "Change passwords for affected accounts.",
  "Do not delete the scam message yet.",
  "Save screenshots, sender phone number, links, QR code, payment slip, transaction ID, and date/time.",
  "Report cyber incidents to Sri Lanka CERT.",
  "Report fraud or money loss to Sri Lanka Police.",
  "For SIM, SMS, or telecom problems, contact your service provider and TRCSL if needed.",
];

const evidenceChecklist = [
  "Screenshot of the message or QR code.",
  "Sender phone number, email, username, or profile link.",
  "Website link or QR content.",
  "Bank transaction reference or payment receipt.",
  "Date and time of the message.",
  "App name where it happened: SMS, WhatsApp, Gmail, browser, Facebook, etc.",
  "Any voice call number used by the scammer.",
];

const verificationSteps = [
  "For bank messages: open the official banking app manually or call the official bank number.",
  "For Airtel, Dialog, Mobitel, Hutch, or SLT offers: check inside the official telco app or official website.",
  "For delivery messages: use the official courier website or app; do not pay through message links.",
  "For QR codes: scan with TrustShield first; do not open unknown QR links directly.",
  "For prize or gift messages: check the official brand website manually; real rewards should not ask for OTP or payment.",
  "If unsure, use Scam State Report after analysis and ask a trusted person before acting.",
];

const privacyRules = [
  "No Gemini API.",
  "No OpenAI API.",
  "No cloud AI upload.",
  "Sensitive messages stay on the device.",
  "Official contact links open only when the user taps them.",
];

const officialContacts: OfficialContact[] = [
  {
    name: "Sri Lanka CERT",
    purpose:
      "Cyber incidents, phishing, hacked accounts, social media security incidents, suspicious links, and online safety help.",
    details: ["Hotline: 101", "Phone: +94 11 269 1692"],
    note: "For social media incidents and financial fraud or scam matters, use the official incident reporting portal.",
    buttons: [
      { title: "Call 101", url: "tel:101" },
      { title: "Open CERT Incident Portal", url: "https://www.cert.gov.lk/report_incident" },
      { title: "Open CERT Website", url: "https://www.cert.gov.lk" },
    ],
  },
  {
    name: "Sri Lanka Police",
    purpose: "Fraud, money loss, threats, criminal complaints, and urgent police help.",
    details: [
      "Police Emergency: 119",
      "Emergency Information Service: 118",
      "Police Headquarters: +94 11 2421111",
    ],
    buttons: [
      { title: "Call Police 119", url: "tel:119" },
      { title: "Open Police Website", url: "https://www.police.lk" },
    ],
  },
  {
    name: "Central Bank of Sri Lanka - Financial Consumer Relations Department",
    purpose: "Complaints or inquiries about banks and financial institutions regulated by CBSL.",
    details: ["Hotline for inquiries: 1935", "Telephone: +94 11 247 7966"],
    buttons: [
      { title: "Call CBSL 1935", url: "tel:1935" },
      { title: "Open CBSL FCRD", url: "https://www.cbsl.gov.lk/en/fcrd" },
    ],
  },
  {
    name: "TRCSL - Telecommunications Regulatory Commission of Sri Lanka",
    purpose: "Telecom, SIM, SMS, mobile-service complaints, and service-provider complaint follow-up.",
    details: [
      "Hotline: 1900",
      "General phone: +94 11 2689345",
      "Consumer complaints email: cc@trc.gov.lk",
    ],
    buttons: [
      { title: "Call TRCSL 1900", url: "tel:1900" },
      { title: "Email TRCSL", url: "mailto:cc@trc.gov.lk" },
      { title: "Open TRCSL Complaints", url: "https://www.trc.gov.lk/complaint/pages_e.php?id=131" },
    ],
  },
];

async function openExternalUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen && !/^https?:\/\//i.test(url)) {
      throw new Error("No app can open this link.");
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Could not open this link",
      "Please check your internet connection or try again later.",
    );
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ContactCard({ contact }: { contact: OfficialContact }) {
  return (
    <View style={styles.contactCard}>
      <Text style={styles.contactName}>{contact.name}</Text>
      <Text style={styles.purpose}>{contact.purpose}</Text>
      <BulletList items={contact.details} />
      {contact.note ? <Text style={styles.note}>{contact.note}</Text> : null}
      <View style={styles.buttonGroup}>
        {contact.buttons.map((button) => (
          <PrimaryButton
            key={button.title}
            title={button.title}
            variant="secondary"
            onPress={() => void openExternalUrl(button.url)}
          />
        ))}
      </View>
    </View>
  );
}

export function SecurityInfoScreen() {
  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <View style={styles.header}>
          <Text style={sharedStyles.title}>Scam Help & Safety</Text>
          <Text style={sharedStyles.body}>
            What to do before and after suspicious messages, links, QR codes, OTP requests,
            and payment scams.
          </Text>
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.suspectCard]}>
          <Text style={sharedStyles.cardTitle}>If you suspect a scam</Text>
          <BulletList items={quickSafetyRules} />
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.clickedCard]}>
          <Text style={sharedStyles.cardTitle}>If you already clicked, paid, or shared details</Text>
          <BulletList items={alreadyClickedSteps} />
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.evidenceCard]}>
          <Text style={sharedStyles.cardTitle}>Evidence to save</Text>
          <BulletList items={evidenceChecklist} />
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.contactsCard]}>
          <Text style={sharedStyles.cardTitle}>Official Sri Lanka contacts</Text>
          <Text style={styles.note}>
            Contact official support. This page is awareness help, not legal or financial advice.
          </Text>
          {officialContacts.map((contact) => (
            <ContactCard key={contact.name} contact={contact} />
          ))}
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.verifyCard]}>
          <Text style={sharedStyles.cardTitle}>How to verify safely</Text>
          <BulletList items={verificationSteps} />
        </View>

        <View style={[sharedStyles.card, styles.sectionCard, styles.privacyCard]}>
          <Text style={sharedStyles.cardTitle}>TrustShield privacy</Text>
          <Text style={sharedStyles.body}>
            TrustShield AI checks messages locally on your phone. OCR, QR detection, scam
            signals, and Gemma 4 E2B reasoning are designed to work without cloud AI.
          </Text>
          <BulletList items={privacyRules} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    paddingTop: 16,
  },
  sectionCard: {
    borderWidth: 1,
  },
  suspectCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  clickedCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  evidenceCard: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  contactsCard: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
  },
  verifyCard: {
    backgroundColor: "#f0fdfa",
    borderColor: "#99f6e4",
  },
  privacyCard: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  list: {
    gap: 10,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  bullet: {
    color: colors.teal,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  bulletText: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
  },
  contactCard: {
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    borderColor: "rgba(15, 23, 42, 0.1)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  contactName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 26,
  },
  purpose: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  note: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 2,
  },
});
