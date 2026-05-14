import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EvidenceList } from "../components/EvidenceList";
import { sharedStyles } from "./sharedStyles";

const privacyItems = [
  "No cloud AI",
  "Messages are processed locally",
  "No default screenshot storage",
  "Built for parents and grandparents",
  "Kaggle/Colab is used only for training/fine-tuning, not for private runtime checking",
];

export function PrivacyScreen() {
  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Privacy</Text>
        <View style={sharedStyles.card}>
          <EvidenceList items={privacyItems} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
