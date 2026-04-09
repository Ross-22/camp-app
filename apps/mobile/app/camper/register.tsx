import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@camp/convex";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  User,
  Church,
  Cake,
  Users,
  Utensils,
} from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterCamperScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [church, setChurch] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const background = useColor("background");
  const foreground = useColor("foreground");
  const mutedColor = useColor("muted");
  const cardBackground = useColor("card");

  // Convex mutation for creating a camper
  const createCamper = useMutation(api.mutations.create);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !team.trim() ||
      !church.trim() ||
      !age.trim() ||
      !gender.trim()
    ) {
      Alert.alert(
        "Incomplete Form",
        "Please enter camper name, team, church, age, and gender.",
      );
      return;
    }

    const parsedAge = parseInt(age.trim(), 10);
    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      Alert.alert("Invalid Age", "Please enter a valid age greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const externalId = typeof id === "string" ? id : id[0];

      await createCamper({
        externalId,
        name: name.trim(),
        team: team.trim(),
        church: church.trim(),
        age: parsedAge,
        gender: gender.trim(),
        foodAllergies: foodAllergies.trim() || undefined,
      });

      Alert.alert("Success", `${name} has been registered!`, [
        {
          text: "OK",
          onPress: () =>
            router.replace({
              pathname: "/camper/[id]",
              params: { id: externalId },
            }),
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Registration Failed", "Could not save camper to database.");
    } finally {
      setLoading(false);
    }
  };

  const displayId = typeof id === "string" ? id : (id?.[0] ?? "");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.replace("/")}
          >
            <Icon name={ArrowLeft} size={20} />
          </Button>
          <Text variant="heading" style={{ color: foreground }}>
            New Registration
          </Text>
        </View>

        <Card
          style={{
            padding: 24,
            alignItems: "center",
            gap: 12,
            backgroundColor: cardBackground,
          }}
        >
          <View
            style={{
              backgroundColor: mutedColor,
              width: 80,
              height: 80,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Icon name={UserPlus} size={32} color="#3b82f6" />
          </View>
          <Text
            variant="body"
            style={{
              textAlign: "center",
              color: foreground,
              fontWeight: "500",
            }}
          >
            The ID{" "}
            <Text style={{ fontWeight: "bold", color: "#3b82f6" }}>
              {displayId}
            </Text>{" "}
            is not in the system.
          </Text>
          <Text
            variant="caption"
            style={{ textAlign: "center", color: foreground, opacity: 0.8 }}
          >
            Please fill out the details below to register.
          </Text>
        </Card>

        <Card style={{ padding: 24, gap: 20 }}>
          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Camper Full Name
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={User}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: John Smith"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Team Name / Color
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={Shield}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: Blue Wolves"
                value={team}
                onChangeText={setTeam}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Church
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={Church}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: First Baptist Church"
                value={church}
                onChangeText={setChurch}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Age
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={Cake}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: 14"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Gender
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={Users}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: Male, Female"
                value={gender}
                onChangeText={setGender}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              variant="caption"
              style={{ color: foreground, fontWeight: "600" }}
            >
              Food Allergies (Optional)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: mutedColor,
                paddingBottom: 4,
              }}
            >
              <Icon
                name={Utensils}
                size={18}
                style={{ marginRight: 8 }}
                color={foreground}
              />
              <Input
                placeholder="Ex: Peanuts, dairy"
                value={foodAllergies}
                onChangeText={setFoodAllergies}
              />
            </View>
          </View>
        </Card>

        <Button
          onPress={handleRegister}
          disabled={loading}
          style={{ height: 60, marginTop: 12 }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
            REGISTER CAMPER
          </Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
