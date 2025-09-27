import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, Text, StyleSheet, Keyboard, SafeAreaView } from "react-native";
import { ActivityIndicator, Button, IconButton, List, Portal, Searchbar, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { MapWithMarkers } from "../../components/MapWithMarkers";
import { PlaceCard } from "../../components/PlaceCard";
import { FiltersPanel } from "../../components/Filters";
import { usePlaces } from "../../context/PlacesContext";
import { useFilters } from "../../context/FiltersContext";
import { scorePlaceWithDetails, getFeatureChips } from "../../services/scoring";
import type { PlacePriorityLayer } from "../../services/scoring";
import type { LocalPlace } from "../../types/models";
import { getUserLocation } from "../../services/location";
import { fetchTextSearchPlaces, isPlacesConfigured } from "../../services/places";

const RECENT_SEARCHES_KEY = "kidspot_recent_searches";
const RECENT_LIMIT = 10;
const SUGGESTIONS_RADIUS_METERS = 4000;
const REMOTE_SUGGESTIONS_DEBOUNCE_MS = 350;
const LAYER_ORDER: Record<PlacePriorityLayer, number> = { A: 0, B: 1, C: 2, D: 3 };
const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceBetweenMeters = (origin: { lat: number; lng: number }, target: { lat: number; lng: number }) => {
  const deltaLat = toRadians(target.lat - origin.lat);
  const deltaLng = toRadians(target.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(target.lat);
  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLng = Math.sin(deltaLng / 2);
  const hav =
    sinDeltaLat * sinDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDeltaLng * sinDeltaLng;
  const clamped = Math.min(1, Math.max(0, hav));
  const c = 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(Math.max(0, 1 - clamped)));
  return EARTH_RADIUS_METERS * c;
};

export default function HomeScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>({ latitude: -23.55052, longitude: -46.633308 });
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const shouldRecenterRef = useRef(false);
  const { places: rawPlaces, loading, refresh } = usePlaces();
  const { filters } = useFilters();
  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);

  const radiusMeters = Math.max(500, Math.round(filters.radiusKm * 1000));
  const rankedPlaces = useMemo(() => {
    if (!rawPlaces || rawPlaces.length === 0) {
      return [];
    }

    type RankedPlace = LocalPlace & {
      kidScore: number;
      featureChips: string[];
      priorityLayer: PlacePriorityLayer;
      distanceMeters: number | null;
    };

    const decorated = rawPlaces.reduce<RankedPlace[]>((acc, place) => {
      const scoreDetails = scorePlaceWithDetails(place, filters);
      if (scoreDetails.shouldHide) {
        return acc;
      }

      const baseChips = getFeatureChips(place);
      const reviewChips = scoreDetails.reviewChips || [];
      const badgeChips = scoreDetails.badges || [];
      const chipSet = new Set([...baseChips, ...reviewChips, ...badgeChips]);

      let distanceMeters: number | null = null;
      if (
        place.coords &&
        Number.isFinite(place.coords.lat) &&
        Number.isFinite(place.coords.lng) &&
        Number.isFinite(center.latitude) &&
        Number.isFinite(center.longitude)
      ) {
        distanceMeters = distanceBetweenMeters(
          { lat: center.latitude, lng: center.longitude },
          { lat: place.coords.lat, lng: place.coords.lng },
        );
      }

      acc.push({
        ...place,
        kidScore: scoreDetails.score,
        featureChips: Array.from(chipSet),
        priorityLayer: scoreDetails.priorityLayer,
        distanceMeters,
      });

      return acc;
    }, []);

    decorated.sort((a, b) => {
      const layerDiff = LAYER_ORDER[a.priorityLayer] - LAYER_ORDER[b.priorityLayer];
      if (layerDiff !== 0) {
        return layerDiff;
      }

      if (b.kidScore !== a.kidScore) {
        return b.kidScore - a.kidScore;
      }

      if (a.distanceMeters !== null && b.distanceMeters !== null) {
        const distanceDiff = a.distanceMeters - b.distanceMeters;
        if (Math.abs(distanceDiff) > 1) {
          return distanceDiff;
        }
      } else if (a.distanceMeters !== null) {
        return -1;
      } else if (b.distanceMeters !== null) {
        return 1;
      }

      const popularityDiff = (b.googleUserRatingsTotal ?? 0) - (a.googleUserRatingsTotal ?? 0);
      if (popularityDiff !== 0) {
        return popularityDiff;
      }

      const ratingDiff = (b.googleRating ?? b.kidspotRating ?? 0) - (a.googleRating ?? a.kidspotRating ?? 0);
      if (Math.abs(ratingDiff) > 1e-3) {
        return ratingDiff > 0 ? 1 : -1;
      }

      return a.name.localeCompare(b.name);
    });

    return decorated;
  }, [rawPlaces, filters, center]);
  const places = rankedPlaces;


  useEffect(() => {
    (async () => {
      try {
        if (typeof SecureStore.isAvailableAsync === 'function') {
          const available = await SecureStore.isAvailableAsync();
          if (!available) {
            return;
          }
        }
        const stored = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
        if (!stored) {
          return;
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          return;
        }
        const filtered = parsed.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0);
        setRecentSearches(filtered.slice(0, RECENT_LIMIT));
      } catch (error) {
        console.warn("Failed to load recent searches", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const loc = await getUserLocation();
      setCenter(loc);
      await refresh(
        { lat: loc.latitude, lng: loc.longitude },
        { radiusMeters },
      );
    })();
  }, [refresh, radiusMeters]);

  const persistRecentSearches = useCallback(async (entries: string[]) => {
    try {
      if (typeof SecureStore.isAvailableAsync === 'function') {
        const available = await SecureStore.isAvailableAsync();
        if (!available) {
          return;
        }
      }
      if (entries.length === 0) {
        await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
      } else {
        await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(entries));
      }
    } catch (error) {
      console.warn("Failed to persist recent searches", error);
    }
  }, []);

  const addRecentSearch = useCallback((value: string) => {
    setRecentSearches((prev) => {
      const normalized = value.toLowerCase();
      const withoutDuplicates = prev.filter((entry) => entry.toLowerCase() !== normalized);
      const updated = [value, ...withoutDuplicates].slice(0, RECENT_LIMIT);
      void persistRecentSearches(updated);
      return updated;
    });
  }, [persistRecentSearches]);

  const handleClearRecents = useCallback(() => {
    setRecentSearches([]);
    void persistRecentSearches([]);
  }, [persistRecentSearches]);

  const localSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [] as string[];
    }

    const seen = new Set<string>();
    const results: string[] = [];

    const consider = (label?: string | null) => {
      if (!label) {
        return;
      }
      const normalizedLabel = label.trim();
      if (!normalizedLabel) {
        return;
      }
      const lower = normalizedLabel.toLowerCase();
      if (!lower.includes(normalizedQuery) || seen.has(lower)) {
        return;
      }
      seen.add(lower);
      results.push(normalizedLabel);
    };

    places.forEach((place) => {
      consider(place.name);
      consider(place.address);
      consider(place.description);
      (place.categories || []).forEach((category) => consider(category));
    });

    return results.slice(0, RECENT_LIMIT);
  }, [places, normalizedQuery]);

  const filteredRecents = useMemo(() => {
    if (!normalizedQuery) {
      return recentSearches;
    }
    return recentSearches.filter((entry) => entry.toLowerCase().includes(normalizedQuery));
  }, [recentSearches, normalizedQuery]);

  const combinedSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];

    const pushUnique = (value?: string) => {
      if (!value) {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) {
        return;
      }
      seen.add(lower);
      merged.push(trimmed);
    };

    localSuggestions.forEach(pushUnique);
    remoteSuggestions.forEach(pushUnique);

    return merged.slice(0, RECENT_LIMIT);
  }, [localSuggestions, remoteSuggestions]);

  useEffect(() => {
    if (!suggestionsVisible) {
      setRemoteSuggestions([]);
      return;
    }

    if (!trimmedQuery) {
      setRemoteSuggestions([]);
      return;
    }

    if (!isPlacesConfigured) {
      setRemoteSuggestions([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const results = await fetchTextSearchPlaces(
          trimmedQuery,
          center.latitude,
          center.longitude,
          SUGGESTIONS_RADIUS_METERS,
        );
        if (cancelled) {
          return;
        }
        const seen = new Set<string>();
        const suggestions: string[] = [];
        const consider = (label?: string | null) => {
          if (!label) {
            return;
          }
          const normalizedLabel = label.trim();
          if (!normalizedLabel) {
            return;
          }
          const lower = normalizedLabel.toLowerCase();
          if (seen.has(lower)) {
            return;
          }
          seen.add(lower);
          suggestions.push(normalizedLabel);
        };

        results.forEach((item: any) => {
          consider(item.name);
          consider(item.formatted_address);
        });

        setRemoteSuggestions(suggestions.slice(0, RECENT_LIMIT));
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to fetch remote suggestions', error);
          setRemoteSuggestions([]);
        }
      }
    }, REMOTE_SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [suggestionsVisible, trimmedQuery, center.latitude, center.longitude]);

  const handleOverlayDismiss = useCallback(() => {
    setSuggestionsVisible(false);
    Keyboard.dismiss();
  }, []);

  const handleSearch = useCallback((rawValue?: string) => {
    const sourceValue = typeof rawValue === "string" ? rawValue : searchQuery;
    const trimmed = sourceValue.trim();

    if (!trimmed) {
      shouldRecenterRef.current = false;
      setSuggestionsVisible(false);
      Keyboard.dismiss();
      return;
    }

    shouldRecenterRef.current = true;
    setSearchQuery(trimmed);
    const options = trimmed
      ? { keyword: trimmed, radiusMeters }
      : { radiusMeters };

    void refresh(
      { lat: center.latitude, lng: center.longitude },
      options,
    );
    addRecentSearch(trimmed);
    setSuggestionsVisible(false);
    Keyboard.dismiss();
  }, [center.latitude, center.longitude, refresh, searchQuery, addRecentSearch, radiusMeters]);

  const handleSuggestionPress = useCallback((value: string) => {
    setSearchQuery(value);
    handleSearch(value);
  }, [handleSearch]);

  useEffect(() => {
    if (!shouldRecenterRef.current) {
      return;
    }

    const keyword = searchQuery.trim();
    if (!keyword || places.length === 0) {
      shouldRecenterRef.current = false;
      return;
    }

    const target = places[0];
    setCenter((prev) => {
      if (Math.abs(prev.latitude - target.coords.lat) < 1e-6 && Math.abs(prev.longitude - target.coords.lng) < 1e-6) {
        return prev;
      }
      return { latitude: target.coords.lat, longitude: target.coords.lng };
    });
    shouldRecenterRef.current = false;
  }, [places, searchQuery]);

  const searchbarProps = {
    placeholder: "Pesquise aqui",
    value: searchQuery,
    onChangeText: setSearchQuery,
    icon: "magnify",
    inputStyle: { fontSize: 16 },
    autoCorrect: false,
    autoComplete: "off" as const,
    autoCapitalize: "none" as const,
    returnKeyType: "search" as const,
    onIconPress: () => handleSearch(),
    onSubmitEditing: () => handleSearch(),
    onClearIconPress: () => setSearchQuery(""),
    blurOnSubmit: false,
  } as const;

  const hasRecents = filteredRecents.length > 0;
  const hasSuggestions = combinedSuggestions.length > 0;
  const showEmptyState = !hasRecents && !hasSuggestions;
  const emptyStateLabel = normalizedQuery
    ? `Sem sugestÃµes para "${trimmedQuery}"`
    : "Nenhuma pesquisa recente";

  return (
    <>
      <Portal>
        {suggestionsVisible ? (
          <Surface style={[StyleSheet.absoluteFillObject, styles.suggestionsSurface]}>
            <SafeAreaView style={styles.overlayContainer}>
              <View style={styles.overlayHeader}>
                <IconButton
                  icon="arrow-left"
                  onPress={handleOverlayDismiss}
                  accessibilityLabel="Voltar"
                />
                <Searchbar
                  {...searchbarProps}
                  style={[styles.overlaySearchbar, styles.searchbar]}
                  autoFocus
                  onFocus={() => setSuggestionsVisible(true)}
                />
              </View>
              <ScrollView
                style={styles.overlayList}
                contentContainerStyle={styles.overlayListContent}
                keyboardShouldPersistTaps="handled"
              >
                <List.Section>
                  {hasRecents ? (
                    <>
                      <List.Subheader>Pesquisas recentes</List.Subheader>
                      {filteredRecents.map((item) => (
                        <List.Item
                          key={`recent-${item}`}
                          title={item}
                          left={(props) => <List.Icon {...props} icon="history" />}
                          onPress={() => handleSuggestionPress(item)}
                        />
                      ))}
                    </>
                  ) : null}
                  {hasSuggestions ? (
                    <>
                      <List.Subheader>Sugestões</List.Subheader>
                      {combinedSuggestions.map((item) => (
                        <List.Item
                          key={`suggestion-${item}`}
                          title={item}
                          left={(props) => <List.Icon {...props} icon="magnify" />}
                          onPress={() => handleSuggestionPress(item)}
                        />
                      ))}
                    </>
                  ) : null}
                  {showEmptyState ? (
                    <List.Item
                      title={emptyStateLabel}
                      left={(props) => <List.Icon {...props} icon={normalizedQuery ? "magnify" : "history"} />}
                    />
                  ) : null}
                </List.Section>
                {recentSearches.length > 0 ? (
                  <Button mode="text" onPress={handleClearRecents} style={styles.clearHistoryButton}>
                    Limpar histórico
                  </Button>
                ) : null}
              </ScrollView>
            </SafeAreaView>
          </Surface>
        ) : null}
      </Portal>
      <ScrollView style={styles.pageContainer}>
        <View style={styles.searchContainer}>
          {!suggestionsVisible ? (
            <Searchbar
              {...searchbarProps}
              style={styles.searchbar}
              onFocus={() => setSuggestionsVisible(true)}
            />
          ) : null}
        </View>
        <MapWithMarkers
          places={places}
          center={center}
          onMarkerPress={(id) => router.push(`/local/${id}`)}
        />
        <FiltersPanel />
        <View style={styles.refreshContainer}>
          <Button mode="outlined" onPress={() => handleSearch()}>
            Buscar
          </Button>
        </View>
        {loading ? <ActivityIndicator style={styles.loadingIndicator} /> : null}
        {!loading && places.length === 0 ? (
          <Text style={styles.emptyState}>Nenhum local encontrado para a busca.</Text>
        ) : null}
        <View style={styles.cardsContainer}>
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    paddingHorizontal: 12,
  },
  searchContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 4,
  },
  suggestionsSurface: {
    backgroundColor: "#fff",
  },
  overlayContainer: {
    flex: 1,
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  overlaySearchbar: {
    flex: 1,
  },
  overlayList: {
    flex: 1,
  },
  overlayListContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  clearHistoryButton: {
    alignSelf: "flex-start",
    marginLeft: 12,
    marginTop: 4,
  },
  refreshContainer: {
    paddingVertical: 8,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  emptyState: {
    marginTop: 16,
    textAlign: "center",
    color: "#666",
  },
  cardsContainer: {
    marginTop: 12,
  },
});

