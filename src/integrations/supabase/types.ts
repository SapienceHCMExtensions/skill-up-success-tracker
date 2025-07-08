export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cost_actuals: {
        Row: {
          amount: number
          description: string | null
          id: string
          invoice_no: string | null
          recorded_at: string | null
          recorded_by: string | null
          session_id: string | null
        }
        Insert: {
          amount: number
          description?: string | null
          id?: string
          invoice_no?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          session_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          invoice_no?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_actuals_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_actuals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          certificate_validity_months: number | null
          code: string
          competencies: string[] | null
          created_at: string | null
          default_cost: number | null
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean | null
          provider_type: Database["public"]["Enums"]["provider_type"]
          title: string
          updated_at: string | null
        }
        Insert: {
          certificate_validity_months?: number | null
          code: string
          competencies?: string[] | null
          created_at?: string | null
          default_cost?: number | null
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          title: string
          updated_at?: string | null
        }
        Update: {
          certificate_validity_months?: number | null
          code?: string
          competencies?: string[] | null
          created_at?: string | null
          default_cost?: number | null
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certificates: {
        Row: {
          certificate_url: string | null
          course_id: string | null
          created_at: string | null
          employee_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          session_id: string | null
        }
        Insert: {
          certificate_url?: string | null
          course_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          session_id?: string | null
        }
        Update: {
          certificate_url?: string | null
          course_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_certificates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          department_id: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          employee_id: string | null
          id: string
          overall_rating: number | null
          responses: Json
          session_id: string | null
          submitted_at: string | null
          template_id: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          overall_rating?: number | null
          responses: Json
          session_id?: string | null
          submitted_at?: string | null
          template_id?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          overall_rating?: number | null
          responses?: Json
          session_id?: string | null
          submitted_at?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evaluation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_templates: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          questions: Json
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          questions: Json
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_rtl: boolean
          name: string
          native_name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_rtl?: boolean
          name: string
          native_name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_rtl?: boolean
          name?: string
          native_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_cost_breakdown: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          plan_id: string | null
        }
        Insert: {
          cost: number
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          plan_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_cost_breakdown_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_employees: {
        Row: {
          assigned_at: string | null
          employee_id: string | null
          id: string
          plan_id: string | null
          required: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          employee_id?: string | null
          id?: string
          plan_id?: string | null
          required?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          employee_id?: string | null
          id?: string
          plan_id?: string | null
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_employees_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_evaluations: {
        Row: {
          created_at: string | null
          description: string | null
          evaluation_type: string | null
          id: string
          plan_id: string | null
          questions: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evaluation_type?: string | null
          id?: string
          plan_id?: string | null
          questions?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evaluation_type?: string | null
          id?: string
          plan_id?: string | null
          questions?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_evaluations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_modules: {
        Row: {
          content_type: string | null
          created_at: string | null
          duration_hours: number | null
          end_date: string | null
          id: string
          learning_outcomes: string | null
          name: string
          plan_id: string | null
          start_date: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          learning_outcomes?: string | null
          name: string
          plan_id?: string | null
          start_date?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          learning_outcomes?: string | null
          name?: string
          plan_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_resources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          plan_id: string | null
          resource_type: string | null
          url_or_path: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          plan_id?: string | null
          resource_type?: string | null
          url_or_path?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          plan_id?: string | null
          resource_type?: string | null
          url_or_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_resources_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_trainers: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string | null
          role: string | null
          trainer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          role?: string | null
          trainer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          role?: string | null
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_trainers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_trainers_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          actual_cost: number | null
          created_at: string | null
          created_by: string | null
          delivery_mode: string | null
          department_id: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          location_platform_info: string | null
          name: string
          objectives: Json | null
          quarter: number | null
          skill_gap_tags: string[] | null
          status: string | null
          success_metrics: Json | null
          target_audience: string | null
          tools_required: string[] | null
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_mode?: string | null
          department_id?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location_platform_info?: string | null
          name: string
          objectives?: Json | null
          quarter?: number | null
          skill_gap_tags?: string[] | null
          status?: string | null
          success_metrics?: Json | null
          target_audience?: string | null
          tools_required?: string[] | null
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_cost?: number | null
          created_at?: string | null
          created_by?: string | null
          delivery_mode?: string | null
          department_id?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location_platform_info?: string | null
          name?: string
          objectives?: Json | null
          quarter?: number | null
          skill_gap_tags?: string[] | null
          status?: string | null
          success_metrics?: Json | null
          target_audience?: string | null
          tools_required?: string[] | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      session_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          score: number | null
          session_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          score?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          course_id: string
          created_at: string | null
          end_date: string
          id: string
          instructor_id: string | null
          location: string | null
          max_seats: number | null
          plan_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          end_date: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          max_seats?: number | null
          plan_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          max_seats?: number | null
          plan_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_audit: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          diff: Json | null
          id: string
          new_data: Json | null
          old_data: Json | null
          row_pk: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          diff?: Json | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_pk: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          diff?: Json | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_pk?: string
          table_name?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          language_id: string
          translation_key: string
          translation_value: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          language_id: string
          translation_key: string
          translation_value: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          language_id?: string
          translation_key?: string
          translation_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "instructor"
        | "employee"
        | "finance"
        | "compliance"
      enrollment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "not_completed"
        | "absent"
      provider_type: "internal" | "external"
      session_status: "scheduled" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "instructor",
        "employee",
        "finance",
        "compliance",
      ],
      enrollment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "not_completed",
        "absent",
      ],
      provider_type: ["internal", "external"],
      session_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
