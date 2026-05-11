import { StyleSheet } from "react-native";

export const colors = {
  background: "#f8fafc",
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#475569",
  line: "#e2e8f0",
  teal: "#0f766e",
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  subtitle: {
    color: colors.teal,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  body: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
  },
  label: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
});
