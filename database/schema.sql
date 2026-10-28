
-- Recipe Finder Database

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Dinner'
        CHECK (category IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert')),
    cooking_time INTEGER NOT NULL DEFAULT 20
        CHECK (cooking_time >= 1 AND cooking_time <= 600),
    image_url TEXT,
    ingredients TEXT[] NOT NULL,
    steps TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL
        REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, recipe_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS recipes_category_created_idx
ON public.recipes (category, created_at DESC);

CREATE INDEX IF NOT EXISTS recipes_name_idx
ON public.recipes (name);

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
ON public.favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS favorites_recipe_idx
ON public.favorites (recipe_id);

-- 5. Automatically update recipe modification time
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recipes_set_updated_at
ON public.recipes;

CREATE TRIGGER recipes_set_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Demo recipe
INSERT INTO public.recipes
(name, description, category, cooking_time, image_url, ingredients, steps)
SELECT
'Tomato Egg Fried Rice',
'A quick rice dish with egg and tomato.',
'Dinner',
25,
NULL,
ARRAY['cooked rice', 'egg', 'tomato', 'onion', 'oil', 'salt'],
ARRAY[
    'Beat the egg with salt.',
    'Scramble the egg in a pan.',
    'Cook onion and tomato.',
    'Add rice and egg and stir-fry.',
    'Season and serve hot.'
]
WHERE NOT EXISTS (
    SELECT 1 FROM public.recipes
    WHERE name = 'Tomato Egg Fried Rice'
);

