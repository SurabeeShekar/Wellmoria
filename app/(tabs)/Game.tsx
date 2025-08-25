import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Trophy, Star, Target, Zap } from "lucide-react-native";

export default function Game() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Trophy size={32} color="#EAB308" /> 
          <Text style={styles.headerText}>Fitness Game</Text>
        </View>
        <Text style={styles.subHeader}>Level up your fitness journey!</Text>
      </View>

      {/* Coming Soon */}
      <View style={styles.cardDashed}>
        <View style={styles.cardContent}>
          <Text style={styles.bigEmoji}>🎮</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.title}>Exciting Games Coming Soon!</Text>
            <Text style={styles.description}>
              We're crafting amazing fitness challenges and mini-games to make 
              your health journey even more fun and engaging.
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {/* Daily Challenges */}
            <View style={[styles.featureCard, { borderColor: "#FDE68A", backgroundColor: "#FEF9C3" }]}>
              <Star size={32} color="#EAB308" style={styles.icon} />
              <Text style={styles.featureTitle}>Daily Challenges</Text>
              <Text style={styles.featureDesc}>
                Complete daily fitness tasks to earn bonus rewards
              </Text>
            </View>

            {/* Achievements */}
            <View style={[styles.featureCard, { borderColor: "#E9D5FF", backgroundColor: "#F3E8FF" }]}>
              <Target size={32} color="#A855F7" style={styles.icon} />
              <Text style={styles.featureTitle}>Achievement System</Text>
              <Text style={styles.featureDesc}>
                Unlock badges and trophies for your accomplishments
              </Text>
            </View>

            {/* Power-ups */}
            <View style={[styles.featureCard, { borderColor: "#BFDBFE", backgroundColor: "#DBEAFE" }]}>
              <Zap size={32} color="#3B82F6" style={styles.icon} />
              <Text style={styles.featureTitle}>Power-ups</Text>
              <Text style={styles.featureDesc}>
                Earn special boosts to accelerate your progress
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.footerNote}>
              💡 In the meantime, keep collecting points by reaching your daily step and water goals!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937", // gray-800
    marginLeft: 8,
  },
  subHeader: {
    color: "#4B5563", // gray-600
    fontSize: 16,
    marginTop: 4,
  },
  cardDashed: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB", // gray-300
    borderRadius: 12,
    padding: 20,
  },
  cardContent: {
    alignItems: "center",
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 24,
  },
  featureCard: {
    flex: 1,
    margin: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  icon: {
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },
  footerNote: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
});
