import { Text } from "react-native";
import { router } from "expo-router";
import ArtworkCard from "../../components/ArtworkCard";
import { Screen, styles } from "../../components/ui";
import { mockArtworks } from "../../data/mockArtworks";
export default function Artworks() {
  return (
    <Screen>
      <Text style={styles.title}>My Artworks</Text>
      <Text style={styles.body}>A little collection of painting ideas.</Text>
      <Text style={styles.caption}>
        Sample collection · new uploads are not saved yet.
      </Text>
      {mockArtworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onPress={() =>
            router.push(
              artwork.mode === "Improve painting"
                ? "/result/improve-painting"
                : "/result/create-reference",
            )
          }
        />
      ))}
    </Screen>
  );
}
