import { StyleSheet } from "react-native";

export const stylesGlobal = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F0",
    paddingHorizontal: 20,
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: 30,
    resizeMode: 'contain',
  },

  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 40,
    gap: 10,
  },

  button: {
    backgroundColor: "#2E7D32", // Verde Agro
    paddingVertical: 14,
    marginVertical: 5,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF", // Texto Branco para contrastar com o verde
  },

  logoutButton: {
    backgroundColor: "#D32F2F", // Vermelho
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    maxWidth: 300,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
});
