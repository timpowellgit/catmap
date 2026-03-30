export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sightings: {
        Row: {
          id: string;
          user_id: string;
          photo_path: string;
          observed_at: string;
          exact_latitude: number;
          exact_longitude: number;
          public_latitude: number;
          public_longitude: number;
          location_accuracy_meters: number;
          notes: string;
          primary_color:
            | 'Black'
            | 'Orange'
            | 'Gray'
            | 'White'
            | 'Brown'
            | 'Cream'
            | 'Mixed'
            | null;
          pattern:
            | 'Solid'
            | 'Tabby'
            | 'Tuxedo'
            | 'Calico'
            | 'Tortoiseshell'
            | 'Spotted'
            | 'Unknown'
            | null;
          is_outdoor_confirmed: boolean;
          points_awarded: number;
          rarity_label: 'Common' | 'Uncommon' | 'Rare';
          status: 'active' | 'hidden' | 'removed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_path: string;
          observed_at: string;
          exact_latitude: number;
          exact_longitude: number;
          public_latitude: number;
          public_longitude: number;
          location_accuracy_meters: number;
          notes?: string;
          primary_color?:
            | 'Black'
            | 'Orange'
            | 'Gray'
            | 'White'
            | 'Brown'
            | 'Cream'
            | 'Mixed'
            | null;
          pattern?:
            | 'Solid'
            | 'Tabby'
            | 'Tuxedo'
            | 'Calico'
            | 'Tortoiseshell'
            | 'Spotted'
            | 'Unknown'
            | null;
          is_outdoor_confirmed?: boolean;
          points_awarded?: number;
          rarity_label?: 'Common' | 'Uncommon' | 'Rare';
          status?: 'active' | 'hidden' | 'removed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_path?: string;
          observed_at?: string;
          exact_latitude?: number;
          exact_longitude?: number;
          public_latitude?: number;
          public_longitude?: number;
          location_accuracy_meters?: number;
          notes?: string;
          primary_color?:
            | 'Black'
            | 'Orange'
            | 'Gray'
            | 'White'
            | 'Brown'
            | 'Cream'
            | 'Mixed'
            | null;
          pattern?:
            | 'Solid'
            | 'Tabby'
            | 'Tuxedo'
            | 'Calico'
            | 'Tortoiseshell'
            | 'Spotted'
            | 'Unknown'
            | null;
          is_outdoor_confirmed?: boolean;
          points_awarded?: number;
          rarity_label?: 'Common' | 'Uncommon' | 'Rare';
          status?: 'active' | 'hidden' | 'removed';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sightings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_sighting: {
        Args: {
          photo_path: string;
          observed_at: string;
          exact_latitude: number;
          exact_longitude: number;
          location_accuracy_meters: number;
          notes?: string;
          primary_color?:
            | 'Black'
            | 'Orange'
            | 'Gray'
            | 'White'
            | 'Brown'
            | 'Cream'
            | 'Mixed'
            | null;
          pattern?:
            | 'Solid'
            | 'Tabby'
            | 'Tuxedo'
            | 'Calico'
            | 'Tortoiseshell'
            | 'Spotted'
            | 'Unknown'
            | null;
          is_outdoor_confirmed?: boolean;
        };
        Returns: Database['public']['Tables']['sightings']['Row'];
      };
    };
  };
};
