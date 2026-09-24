-- =====================================================================
-- Create It - Dados de teste
-- Todos os usuários de teste usam a senha: create123
-- =====================================================================
SET search_path TO createit;

INSERT INTO categoria_acao (nome, pontos_base) VALUES
('Reciclagem', 30), ('Transporte', 50), ('Água', 20), ('Energia', 25);

INSERT INTO patrocinador (razao_social, cnpj, porte, localizacao) VALUES
('Empório Granel Vivo',   '11222333000101', 'pequeno', 'Alphaville'),
('Café da Esquina',       '22333444000102', 'micro',   'Centro'),
('Pedal Oficina de Bikes','33444555000103', 'micro',   'Vila Nova'),
('Viveiro Mata Nativa',   '44555666000104', 'pequeno', 'Jardim das Flores');

INSERT INTO usuario (nome, cpf, email, senha_hash, usuario, bio, cidade) VALUES
('Marina Souza', '11111111111', 'marina@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'marina.s', 'Reciclo tudo que dá.', 'Santana de Parnaíba'),
('Rafael Lima',  '22222222222', 'rafael@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'rafa.l',   'Bike todo dia.',        'Barueri'),
('Carla Alves',  '33333333333', 'carla@createit.com',  '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'carla.a',  'Economizando água em casa.', 'Osasco'),
('Lucas Rocha',  '44444444444', 'lucas@createit.com',  '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'lucas.recicla', 'Cantinho da reciclagem em casa.', 'São Paulo'),
('Usuário Demo', '55555555555', 'demo@createit.com',   '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'demo',     'Tentando deixar o dia a dia um pouco mais verde.', 'Santana de Parnaíba');

INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim) VALUES
(1, 1, 'Semana sem plástico', 'Registre 7 ações evitando plástico descartável: sacola de pano, garrafa própria, compra a granel.', 7, 150, CURRENT_DATE - 3, CURRENT_DATE + 4),
(3, 2, 'Vá de bike 3 vezes na semana', 'Troque o carro pela bike em três deslocamentos.', 3, 80, CURRENT_DATE - 2, CURRENT_DATE + 5),
(NULL, 3, 'Banho mais curto', 'Registre 5 banhos de até 5 minutos.', 5, 50, CURRENT_DATE - 1, CURRENT_DATE + 6);

INSERT INTO conquista (nome, descricao, id_categoria, qtd_acoes) VALUES
('Primeira ação', 'Registrou a primeira ação validada', NULL, 1),
('Reciclador',    '3 ações de reciclagem validadas', 1, 3),
('Sem carro',     '3 ações de transporte validadas', 2, 3),
('Poupa água',    '3 ações de economia de água validadas', 3, 3),
('Energia limpa', '3 ações de economia de energia validadas', 4, 3);

-- Postagens entram como 'pendente' e depois são validadas:
-- é o UPDATE que dispara o trigger e credita os pontos.
INSERT INTO postagem (id_usuario, id_categoria, id_desafio, conteudo, data_postagem) VALUES
(1, 1, 1,    'Separei o lixo reciclável do condomínio e levei no ponto de coleta aqui do bairro.', now() - interval '2 hours'),
(2, 2, 2,    'Semana inteira indo pro trabalho de bike. Zero carro.', now() - interval '5 hours'),
(3, 3, NULL, 'Instalei um redutor de vazão no chuveiro e na pia da cozinha.', now() - interval '8 hours'),
(4, 1, NULL, 'Montei um cantinho de reciclagem em casa com três lixeiras: plástico, papel e vidro.', now() - interval '1 day'),
(1, 1, 1,    'Levei sacola de pano e comprei tudo a granel hoje.', now() - interval '1 day'),
(1, 1, NULL, 'Garrafas de vidro lavadas e separadas para a coleta.', now() - interval '2 days'),
(2, 2, 2,    'Fui de bike até a faculdade.', now() - interval '2 days'),
(2, 2, NULL, 'Carona solidária com dois colegas.', now() - interval '3 days'),
(5, 1, NULL, 'Levei as garrafas e latas da semana no ponto de coleta do bairro.', now() - interval '3 hours'),
(5, 2, NULL, 'Fui e voltei do trabalho de bike a semana toda.', now() - interval '2 days'),
(5, 3, NULL, 'Banho de 5 minutos a semana toda.', now() - interval '4 days');

UPDATE postagem SET status_validacao = 'validada';

-- Pontos extras de histórico para deixar o ranking interessante
UPDATE usuario SET pontos_ecologicos = pontos_ecologicos + 2150 WHERE id_usuario = 1;
UPDATE usuario SET pontos_ecologicos = pontos_ecologicos + 1720 WHERE id_usuario = 2;
UPDATE usuario SET pontos_ecologicos = pontos_ecologicos + 900  WHERE id_usuario = 3;
UPDATE usuario SET pontos_ecologicos = pontos_ecologicos + 1500 WHERE id_usuario = 4;
UPDATE usuario SET pontos_ecologicos = pontos_ecologicos + 1640 WHERE id_usuario = 5;
UPDATE usuario SET nivel = 1 + pontos_ecologicos / 500;

INSERT INTO seguidor (id_seguidor, id_seguido) VALUES
(5,1),(5,2),(5,3),(1,5),(2,5),(1,2),(2,1),(3,1),(4,1);

INSERT INTO curtida (id_usuario, id_postagem) VALUES
(2,1),(3,1),(4,1),(5,1),(1,2),(3,2),(5,2),(1,3),(5,4),(1,9),(2,9);

INSERT INTO comentario (id_usuario, id_postagem, texto) VALUES
(5, 1, 'Boa! Onde fica esse ponto de coleta?'),
(1, 9, 'Mandou bem!'),
(3, 2, 'Inspiração pra mim.');

INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade) VALUES
(2, 'Café grátis levando sua caneca', 'Um café coado grátis para quem levar a própria caneca.', 500, 30, CURRENT_DATE + 60),
(1, '10% de desconto em produtos a granel', 'Desconto em qualquer compra a granel.', 800, 50, CURRENT_DATE + 90),
(4, 'Muda de árvore nativa para plantio', 'Uma muda de espécie nativa da Mata Atlântica.', 1200, 15, CURRENT_DATE + 45),
(3, 'Revisão de bike com 50% off', 'Revisão completa com metade do preço.', 1500, 10, CURRENT_DATE + 30),
(1, 'Kit sustentável: garrafa, sacola e canudo de inox', 'Kit completo para evitar descartáveis.', 2000, 5, CURRENT_DATE + 30);

-- Resgate de exemplo usando a função transacional (o nível é recalculado depois)
SELECT fn_resgatar(5, 1);

UPDATE usuario SET nivel = 1 + pontos_ecologicos / 500;
