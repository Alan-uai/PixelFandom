-- =====================================================
-- PIXEL FANTASY - ROW LEVEL SECURITY (RLS) POLICIES
-- Regras de segurança para o banco de dados Supabase
-- =====================================================

-- =====================================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dungeons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE swords ENABLE ROW LEVEL SECURITY;
ALTER TABLE armors ENABLE ROW LEVEL SECURITY;
ALTER TABLE potions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE auras ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamepasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chests ENABLE ROW LEVEL SECURITY;
ALTER TABLE obelisks ENABLE ROW LEVEL SECURITY;
ALTER TABLE powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_jewelry ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rank ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_obelisks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamepasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

ALTER TABLE wiki_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE negative_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_metadata ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA DADOS PÚBLICOS DO JOGO
-- =====================================================

-- --- MUNDOS ---
-- Todos podem ler; apenas admin pode inserir/atualizar
CREATE POLICY "Mundos são públicos para leitura"
    ON worlds FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir mundos"
    ON worlds FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar mundos"
    ON worlds FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- MASMORRAS ---
CREATE POLICY "Masmorras são públicas para leitura"
    ON dungeons FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir masmorras"
    ON dungeons FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar masmorras"
    ON dungeons FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- BOSSES ---
CREATE POLICY "Bosses são públicos para leitura"
    ON bosses FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir bosses"
    ON bosses FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar bosses"
    ON bosses FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- ESPADAS ---
CREATE POLICY "Espadas são públicas para leitura"
    ON swords FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir espadas"
    ON swords FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar espadas"
    ON swords FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- ARMADURAS ---
CREATE POLICY "Armaduras são públicas para leitura"
    ON armors FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir armaduras"
    ON armors FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar armaduras"
    ON armors FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- POÇÕES ---
CREATE POLICY "Poções são públicas para leitura"
    ON potions FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir poções"
    ON potions FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar poções"
    ON potions FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- ANÉIS ---
CREATE POLICY "Anéis são públicos para leitura"
    ON rings FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir anéis"
    ON rings FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar anéis"
    ON rings FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- ACESSÓRIOS ---
CREATE POLICY "Acessórios são públicos para leitura"
    ON accessories FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir acessórios"
    ON accessories FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar acessórios"
    ON accessories FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- AURAS ---
CREATE POLICY "Auras são públicas para leitura"
    ON auras FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir auras"
    ON auras FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar auras"
    ON auras FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- PETS ---
CREATE POLICY "Pets são públicos para leitura"
    ON pets FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir pets"
    ON pets FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar pets"
    ON pets FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- FIGHTERS ---
CREATE POLICY "Fighters são públicos para leitura"
    ON fighters FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir fighters"
    ON fighters FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar fighters"
    ON fighters FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- GAMEPASSES ---
CREATE POLICY "Gamepasses são públicos para leitura"
    ON gamepasses FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir gamepasses"
    ON gamepasses FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar gamepasses"
    ON gamepasses FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- CONQUISTAS ---
CREATE POLICY "Conquistas são públicas para leitura"
    ON achievements FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir conquistas"
    ON achievements FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar conquistas"
    ON achievements FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- MISSÕES ---
CREATE POLICY "Missões são públicas para leitura"
    ON quests FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir missões"
    ON quests FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar missões"
    ON quests FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- BAÚS ---
CREATE POLICY "Baús são públicos para leitura"
    ON chests FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir baús"
    ON chests FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar baús"
    ON chests FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- OBELISKOS ---
CREATE POLICY "Obeliscos são públicos para leitura"
    ON obelisks FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir obeliscos"
    ON obelisks FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar obeliscos"
    ON obelisks FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- PODERES ---
CREATE POLICY "Poderes são públicos para leitura"
    ON powers FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir poderes"
    ON powers FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar poderes"
    ON powers FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- POWER STATS ---
CREATE POLICY "Stats de poder são públicos para leitura"
    ON power_stats FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir stats de poder"
    ON power_stats FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar stats de poder"
    ON power_stats FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- WIKI CONTENT ---
CREATE POLICY "Wiki é público para leitura"
    ON wiki_content FOR SELECT
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir wiki"
    ON wiki_content FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode atualizar wiki"
    ON wiki_content FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode deletar wiki"
    ON wiki_content FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- --- METADATA ---
CREATE POLICY "Metadata é público para leitura"
    ON game_metadata FOR SELECT
    USING (true);

CREATE POLICY "Admin pode inserir metadata"
    ON game_metadata FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin pode atualizar metadata"
    ON game_metadata FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- POLÍTICAS PARA DADOS DO USUÁRIO
-- =====================================================

-- --- PERFIS ---
-- Usuários podem ler seu próprio perfil
CREATE POLICY "Usuários leem próprio perfil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Usuário cria automaticamente ao se registrar (via trigger)
-- Admin pode ler todos os perfis
CREATE POLICY "Admin lê todos os perfis"
    ON profiles FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Usuário pode atualizar próprio perfil
CREATE POLICY "Usuários atualizam próprio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- --- ARMAS DO USUÁRIO ---
CREATE POLICY "Usuários leem próprias armas"
    ON user_weapons FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprias armas"
    ON user_weapons FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias armas"
    ON user_weapons FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias armas"
    ON user_weapons FOR DELETE
    USING (auth.uid() = user_id);

-- --- INVENTÁRIO ---
CREATE POLICY "Usuários leem próprio inventário"
    ON user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem no próprio inventário"
    ON user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio inventário"
    ON user_inventory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam do próprio inventário"
    ON user_inventory FOR DELETE
    USING (auth.uid() = user_id);

-- --- FIGHTERS ---
CREATE POLICY "Usuários leem próprios fighters"
    ON user_fighters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprios fighters"
    ON user_fighters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios fighters"
    ON user_fighters FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios fighters"
    ON user_fighters FOR DELETE
    USING (auth.uid() = user_id);

-- --- JOIAS ---
CREATE POLICY "Usuários leem próprias joias"
    ON user_jewelry FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprias joias"
    ON user_jewelry FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias joias"
    ON user_jewelry FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias joias"
    ON user_jewelry FOR DELETE
    USING (auth.uid() = user_id);

-- --- RANK ---
CREATE POLICY "Usuários leem próprio rank"
    ON user_rank FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprio rank"
    ON user_rank FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio rank"
    ON user_rank FOR UPDATE
    USING (auth.uid() = user_id);

-- --- CONQUISTAS ---
CREATE POLICY "Usuários leem próprias conquistas"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprias conquistas"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias conquistas"
    ON user_achievements FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias conquistas"
    ON user_achievements FOR DELETE
    USING (auth.uid() = user_id);

-- --- OBELISKOS ---
CREATE POLICY "Usuários leem próprios obeliscos"
    ON user_obelisks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprios obeliscos"
    ON user_obelisks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios obeliscos"
    ON user_obelisks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios obeliscos"
    ON user_obelisks FOR DELETE
    USING (auth.uid() = user_id);

-- --- INDEX ---
CREATE POLICY "Usuários leem próprio index"
    ON user_index FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprio index"
    ON user_index FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio index"
    ON user_index FOR UPDATE
    USING (auth.uid() = user_id);

-- --- GAMEPASSES ---
CREATE POLICY "Usuários leem próprios gamepasses"
    ON user_gamepasses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprios gamepasses"
    ON user_gamepasses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios gamepasses"
    ON user_gamepasses FOR DELETE
    USING (auth.uid() = user_id);

-- --- MISSÕES ---
CREATE POLICY "Usuários leem próprias missões"
    ON user_quests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem próprias missões"
    ON user_quests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias missões"
    ON user_quests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias missões"
    ON user_quests FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA FEEDBACK (PÚBLICO)
-- =====================================================

-- --- FEEDBACK NEGATIVO ---
-- Usuários autenticados podem criar feedback
CREATE POLICY "Usuários autenticados criam feedback"
    ON negative_feedback FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários leem próprio feedback
CREATE POLICY "Usuários leem próprio feedback"
    ON negative_feedback FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Admin pode atualizar feedback
CREATE POLICY "Admin atualiza feedback"
    ON negative_feedback FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para criação automática de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIM DAS POLÍTICAS
-- =====================================================