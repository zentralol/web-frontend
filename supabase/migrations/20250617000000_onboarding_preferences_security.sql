alter table public.onboarding_preferences
  add constraint onboarding_preferences_travel_pace_check
    check (travel_pace in ('relaxed', 'moderate', 'packed'));

alter table public.onboarding_preferences
  add constraint onboarding_preferences_budget_range_check
    check (budget_range in ('budget', 'moderate', 'premium'));

alter table public.onboarding_preferences
  add constraint onboarding_preferences_crowd_tolerance_check
    check (crowd_tolerance in ('avoid', 'moderate', 'dont_mind'));

alter table public.onboarding_preferences
  add constraint onboarding_preferences_interests_check
    check (
      interests <@ array[
        'food',
        'nature',
        'history',
        'art',
        'nightlife',
        'shopping',
        'architecture',
        'localCulture'
      ]::text[]
      and cardinality(interests) <= 8
    );

alter table public.onboarding_preferences
  add constraint onboarding_preferences_mobility_needs_check
    check (
      mobility_needs <@ array[
        'wheelchairAccess',
        'stepFree',
        'limitedWalking',
        'frequentBreaks',
        'elevatorAccess'
      ]::text[]
      and cardinality(mobility_needs) <= 5
    );

alter table public.onboarding_preferences
  add constraint onboarding_preferences_dietary_needs_check
    check (
      dietary_needs <@ array[
        'vegetarian',
        'vegan',
        'halal',
        'kosher',
        'glutenFree',
        'nutAllergy',
        'dairyFree'
      ]::text[]
      and cardinality(dietary_needs) <= 7
    );

alter table public.onboarding_preferences
  add constraint onboarding_preferences_inclusion_needs_check
    check (
      inclusion_needs <@ array[
        'quietSpaces',
        'sensoryFriendly',
        'familyFriendly',
        'lgbtqSafe',
        'prayerSpaces',
        'englishFriendly',
        'genderNeutralRestrooms'
      ]::text[]
      and cardinality(inclusion_needs) <= 7
    );

alter table public.onboarding_preferences enable row level security;

revoke all on table public.onboarding_preferences from anon, authenticated;
grant all on table public.onboarding_preferences to service_role;
