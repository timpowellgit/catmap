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
      sighting_analysis_jobs: {
        Row: {
          id: string;
          sighting_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          attempt_count: number;
          available_at: string;
          locked_at: string | null;
          locked_by: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sighting_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          attempt_count?: number;
          available_at?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sighting_id?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          attempt_count?: number;
          available_at?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sighting_analysis_jobs_sighting_id_fkey';
            columns: ['sighting_id'];
            isOneToOne: true;
            referencedRelation: 'sightings';
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
      list_active_sightings: {
        Args: {
          result_limit?: number;
          before_created_at?: string | null;
        };
        Returns: {
          id: string;
          user_id: string;
          photo_path: string;
          observed_at: string;
          public_latitude: number;
          public_longitude: number;
          notes: string;
          primary_color: Database['public']['Tables']['sightings']['Row']['primary_color'];
          pattern: Database['public']['Tables']['sightings']['Row']['pattern'];
          points_awarded: number;
          rarity_label: Database['public']['Tables']['sightings']['Row']['rarity_label'];
          created_at: string;
        }[];
      };
    };
  };
};
