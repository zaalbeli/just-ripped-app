import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import authService from '../../services/auth';
import databaseService from '../../services/database';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // ← ADD THIS: Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Profile screen focused - reloading data...');
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      console.log('📊 Loading profile data...');
      
      const currentUser = await authService.getCurrentUser();
      console.log('👤 Current user ID:', currentUser?.id);
      setUser(currentUser);
      
      const userProfile = await databaseService.getProfile(currentUser.id);
      console.log('📝 Profile loaded:', userProfile?.username);
      setProfile(userProfile);
      
      // Load user's cards
      const userCards = await databaseService.getUserCards(currentUser.id);
      console.log('🎴 Cards loaded:', userCards?.length || 0);
      
      // Log first card details if any exist
      if (userCards && userCards.length > 0) {
        console.log('📸 First card:', {
          player: userCards[0].player_name,
          image: userCards[0].image_front_url,
          value: userCards[0].estimated_value
        });
      }
      
      setCards(userCards || []);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await authService.signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        }
      },
    ]);
  };

  const renderCardItem = ({ item }) => (
    <TouchableOpacity style={styles.cardItem} activeOpacity={0.7}>
      <Image
        source={{ uri: item.image_front_url }}
        style={styles.cardItemImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.cardItemOverlay}>
        <Text style={styles.cardItemPlayer} numberOfLines={1}>
          {item.player_name}
        </Text>
        <Text style={styles.cardItemValue}>${item.estimated_value?.toFixed(0) || '0'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>No cards yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to scan your first card</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalValue = cards.reduce((sum, card) => sum + (card.estimated_value || 0), 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <>
            {/* Profile Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.username}>@{profile?.username || 'username'}</Text>
              <Text style={styles.email}>{user?.email}</Text>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{cards.length}</Text>
                  <Text style={styles.statLabel}>Cards</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Value</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile?.trades_completed || 0}</Text>
                  <Text style={styles.statLabel}>Trades</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Collection Section */}
            {cards.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>MY COLLECTION ({cards.length})</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={cards.length === 0 ? styles.emptyContainer : styles.gridContainer}
        columnWrapperStyle={cards.length > 0 ? styles.columnWrapper : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background 
  },
  header: { 
    alignItems: 'center', 
    padding: 24, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: COLORS.white 
  },
  username: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textPrimary, 
    marginBottom: 4 
  },
  email: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    marginBottom: 24 
  },
  stats: { 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-around', 
    marginBottom: 24 
  },
  stat: { 
    alignItems: 'center' 
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textPrimary, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    color: COLORS.textSecondary 
  },
  editButton: { 
    backgroundColor: COLORS.surface, 
    paddingHorizontal: 32, 
    paddingVertical: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  editButtonText: { 
    color: COLORS.textPrimary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  sectionHeader: { 
    padding: 16, 
    paddingBottom: 8 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    letterSpacing: 1 
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: 8,
  },
  cardItem: {
    flex: 1,
    aspectRatio: 3/4,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  cardItemImage: {
    width: '100%',
    height: '100%',
  },
  cardItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  cardItemPlayer: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardItemValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 80 
  },
  emptyText: { 
    fontSize: 16, 
    color: COLORS.textPrimary, 
    marginTop: 16,
    marginBottom: 8 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  signOutButton: { 
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16, 
    backgroundColor: COLORS.surface, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  signOutText: { 
    color: COLORS.error, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});