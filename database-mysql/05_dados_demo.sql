-- =====================================================================
-- Create It - Dados de demonstração (MySQL 8)
-- Enche o feed, os desafios, as recompensas e os painéis dos patrocinadores.
--
-- Rode DEPOIS do 04_patrocinador.sql. Funciona em qualquer cliente (não usa
-- DELIMITER nem variáveis de sessão) e pode rodar mais de uma vez: o que já
-- existe é pulado. Os IDs são buscados por e-mail, CNPJ e título.
-- Ninguém ganha ponto de graça: os pontos vêm das ações (trigger de validação).
-- Senha de todas as contas novas: create123
-- =====================================================================

SET NAMES utf8mb4;
USE createit;

-- ---------------------------------------------------------------- contas
INSERT IGNORE INTO usuario (nome, cpf, email, senha_hash, usuario, bio, cidade, id_patrocinador)
SELECT 'Beatriz Nogueira', '70000000001', 'bia@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'bia.nogueira', 'Lixo zero em construção. Um pote de cada vez.', 'Barueri', NULL
UNION ALL SELECT 'Thiago Martins', '70000000002', 'thiago@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'thiago.pedala', 'Trabalho a 12 km de casa e vou de bike.', 'Santana de Parnaíba', NULL
UNION ALL SELECT 'Juliana Prado', '70000000003', 'juliana@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'ju.prado', 'Feira, granel e composteira no apê.', 'Osasco', NULL
UNION ALL SELECT 'Gabriel Costa', '70000000004', 'gabriel@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'gabs.costa', 'Estudante de engenharia ambiental.', 'São Paulo', NULL
UNION ALL SELECT 'Fernanda Ribeiro', '70000000005', 'fernanda@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'fe.ribeiro', 'Mãe de dois e professora. Ensinando a separar o lixo em casa.', 'Cotia', NULL
UNION ALL SELECT 'Diego Almeida', '70000000006', 'diego@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'diego.almeida', 'Ônibus, metrô e muita playlist.', 'Carapicuíba', NULL
UNION ALL SELECT 'Camila Ferraz', '70000000007', 'camila@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'cami.ferraz', 'Horta na varanda e cisterna no quintal.', 'Santana de Parnaíba', NULL
UNION ALL SELECT 'Bruno Teixeira', '70000000008', 'bruno@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'bruno.tx', 'Tentando gastar menos energia (e menos dinheiro).', 'Barueri', NULL
UNION ALL SELECT 'Larissa Mendes', '70000000009', 'larissa@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'lari.mendes', 'Vegetariana, ciclista de fim de semana.', 'São Paulo', NULL
UNION ALL SELECT 'Eduardo Sato', '70000000010', 'eduardo@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'edu.sato', 'Engenheiro, fã de energia solar.', 'Alphaville', NULL
UNION ALL SELECT 'Café da Esquina', '70000000011', 'cafe@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'cafedaesquina', 'Café coado, pão de queijo e caneca própria.', 'Centro', (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102')
UNION ALL SELECT 'Pedal Oficina de Bikes', '70000000012', 'pedal@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'pedaloficina', 'Oficina e loja de bikes. Pedale mais!', 'Vila Nova', (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103')
UNION ALL SELECT 'Viveiro Mata Nativa', '70000000013', 'viveiro@createit.com', '$2a$10$SaVHXylx0VnPWPCtzAU7i.j7r/cTaL3aOYnBHxbr5Y98DTDTMmy5O', 'viveiromatanativa', 'Mudas nativas da Mata Atlântica.', 'Jardim das Flores', (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104');

-- -------------------------------------------------------------- desafios
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Reciclagem'), 'Traga seu pote', 'Compre a granel usando o seu próprio pote ou sacola. Registre 4 compras sem embalagem descartável.', 4, 120,
       DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Traga seu pote');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Reciclagem'), 'Mês do lixo zero', 'Um mês inteiro tentando não mandar nada reciclável para o lixo comum. Registre 10 ações.', 10, 300,
       DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 35 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Mês do lixo zero');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Reciclagem'), 'Feira sem sacolinha', 'Vá à feira com sacola retornável três vezes.', 3, 60,
       DATE_ADD(CURRENT_DATE(), INTERVAL -25 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Feira sem sacolinha');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Reciclagem'), 'Caneca própria todo dia', 'Leve sua caneca ou copo reutilizável em 5 cafés da semana.', 5, 100,
       DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 11 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Caneca própria todo dia');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Energia'), 'Desligue o que não usa', 'Tire da tomada aparelhos em stand-by e apague luzes de cômodos vazios. 5 registros.', 5, 90,
       DATE_ADD(CURRENT_DATE(), INTERVAL -2 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 12 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Desligue o que não usa');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Transporte'), 'Pedale até o trabalho', 'Troque o carro pela bike em 5 deslocamentos para o trabalho ou a faculdade.', 5, 150,
       DATE_ADD(CURRENT_DATE(), INTERVAL -8 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 6 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Pedale até o trabalho');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Transporte'), 'Carona solidária', 'Divida o carro com colegas em 4 trajetos.', 4, 100,
       DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Carona solidária');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Transporte'), 'Semana da bike', 'Edição de outubro: 3 passeios de bike pela cidade.', 3, 80,
       DATE_ADD(CURRENT_DATE(), INTERVAL -40 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL -30 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Semana da bike');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Água'), 'Reuse a água da chuva', 'Capte água da chuva e use para regar ou lavar o quintal. 4 registros.', 4, 120,
       DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 16 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Reuse a água da chuva');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Água'), 'Rega consciente', 'Regue as plantas no início da manhã ou à noite, sem desperdício. 5 registros.', 5, 80,
       DATE_ADD(CURRENT_DATE(), INTERVAL -1 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 20 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Rega consciente');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), (SELECT id_categoria FROM categoria_acao WHERE nome = 'Água'), 'Primavera verde', 'Plante e cuide: registre 6 ações de economia de água no jardim.', 6, 200,
       DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 37 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Primavera verde');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT NULL, (SELECT id_categoria FROM categoria_acao WHERE nome = 'Energia'), 'Hora sem luz', 'Uma hora por dia com tudo desligado. Registre 7 vezes.', 7, 70,
       DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Hora sem luz');
INSERT INTO desafio (id_patrocinador, id_categoria, titulo, descricao, meta_acoes, pontos_bonus, data_inicio, data_fim)
SELECT NULL, (SELECT id_categoria FROM categoria_acao WHERE nome = 'Transporte'), 'Ônibus em vez de carro', 'Use transporte público em 5 trajetos que você faria de carro.', 5, 60,
       DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 8 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM desafio WHERE titulo = 'Ônibus em vez de carro');

-- ----------------------------------------------------------- recompensas
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), 'Sacola de algodão cru', 'Sacola retornável com o logo do Empório. Retire na loja.', 400, 40,
       DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Sacola de algodão cru');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), 'Frete grátis no delivery a granel', 'Vale para um pedido acima de R$ 60 na região de Alphaville.', 600, 0,
       DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Frete grátis no delivery a granel');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '11222333000101'), 'Pote de vidro de 1 litro', 'Pote com tampa hermética para suas compras a granel.', 350, 25,
       DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Pote de vidro de 1 litro');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102'), 'Pão de queijo com café coado', 'Combo para tomar na loja. Um por pessoa por dia.', 700, 20,
       DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Pão de queijo com café coado');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102'), 'Caneca de cerâmica Café da Esquina', 'Caneca artesanal de 300 ml.', 1500, 8,
       DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Caneca de cerâmica Café da Esquina');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '22333444000102'), 'Café da manhã completo', 'Promoção de lançamento.', 1200, 5,
       DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Café da manhã completo');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), 'Calibragem e lubrificação grátis', 'Calibragem dos pneus e lubrificação da corrente na hora.', 300, 50,
       DATE_ADD(CURRENT_DATE(), INTERVAL 40 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Calibragem e lubrificação grátis');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), 'Kit de luz de segurança para bike', 'Farol dianteiro e lanterna traseira recarregáveis via USB.', 1800, 6,
       DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Kit de luz de segurança para bike');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '33444555000103'), 'Aula de mecânica básica', 'Aula em grupo de 2 horas: troca de câmara, freio e corrente.', 900, 12,
       DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Aula de mecânica básica');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), 'Vaso autoirrigável', 'Vaso médio com reservatório de água.', 1000, 10,
       DATE_ADD(CURRENT_DATE(), INTERVAL 50 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Vaso autoirrigável');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), 'Composteira doméstica pequena', 'Três caixas empilháveis, ideal para apartamento.', 2500, 4,
       DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Composteira doméstica pequena');
INSERT INTO recompensa (id_patrocinador, titulo, descricao, custo_pontos, estoque, validade)
SELECT (SELECT id_patrocinador FROM patrocinador WHERE cnpj = '44555666000104'), 'Pacote de sementes de horta', 'Alface, rúcula, cebolinha e salsinha.', 250, 60,
       DATE_ADD(CURRENT_DATE(), INTERVAL 120 DAY)
 WHERE NOT EXISTS (SELECT 1 FROM recompensa WHERE titulo = 'Pacote de sementes de horta');

-- ------------------------------------------------------------- postagens
-- Entram como 'pendente'; o UPDATE logo depois valida e o trigger credita os pontos.
INSERT INTO postagem (id_usuario, id_categoria, id_desafio, conteudo, data_postagem)
SELECT u.id_usuario, c.id_categoria, d.id_desafio, n.conteudo, DATE_SUB(UTC_TIMESTAMP(), INTERVAL n.horas HOUR)
  FROM (
        SELECT 'bia@createit.com' AS email, 'Reciclagem' AS categoria, 'Traga seu pote' AS desafio, 'Primeira compra a granel com os potes de vidro que eu tinha guardado. Arroz, feijão e aveia sem nenhuma embalagem!' AS conteudo, 140 AS horas
        UNION ALL SELECT 'bia@createit.com', 'Reciclagem', 'Traga seu pote', 'Levei a sacola de pano e os saquinhos de tecido pro Empório. A moça do caixa até elogiou.', 98
        UNION ALL SELECT 'bia@createit.com', 'Reciclagem', 'Traga seu pote', 'Granola e castanhas no pote de geleia reaproveitado.', 52
        UNION ALL SELECT 'bia@createit.com', 'Reciclagem', 'Traga seu pote', 'Quarta compra sem embalagem do mês. Desafio concluído! 🫙', 6
        UNION ALL SELECT 'bia@createit.com', 'Água', NULL, 'Coloquei um balde no chuveiro enquanto a água esquenta. Deu 6 litros pra lavar o quintal.', 30
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Pedale até o trabalho', 'Primeiro dia indo de bike pro trabalho. 12 km e cheguei antes do que de carro, acredita?', 170
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Pedale até o trabalho', 'Segundo dia. As pernas reclamaram, mas o trânsito da Castello nem me viu.', 146
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Pedale até o trabalho', 'Choveu, mas fui de capa. Bike é vida.', 122
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Pedale até o trabalho', 'Quarto dia. Já tem um colega querendo ir junto semana que vem.', 74
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Pedale até o trabalho', 'Quinto pedal da semana. Desafio fechado! Valeu, Pedal Oficina pela revisão.', 3
        UNION ALL SELECT 'thiago@createit.com', 'Transporte', 'Carona solidária', 'Dei carona pra dois vizinhos que trabalham perto de mim.', 26
        UNION ALL SELECT 'juliana@createit.com', 'Reciclagem', 'Feira sem sacolinha', 'Feira de domingo só com a sacola retornável e o carrinho.', 480
        UNION ALL SELECT 'juliana@createit.com', 'Reciclagem', 'Feira sem sacolinha', 'Segunda feira sem sacolinha. O feirante já separa as coisas direto na minha sacola.', 336
        UNION ALL SELECT 'juliana@createit.com', 'Reciclagem', 'Feira sem sacolinha', 'Terceira e última! Feira de sábado sem nenhum plástico.', 192
        UNION ALL SELECT 'juliana@createit.com', 'Reciclagem', 'Traga seu pote', 'Comprei temperos a granel nos potinhos que eu já tinha.', 45
        UNION ALL SELECT 'juliana@createit.com', 'Reciclagem', NULL, 'Montei a composteira com baldes reaproveitados. Os restos de casca agora viram adubo.', 12
        UNION ALL SELECT 'gabriel@createit.com', 'Transporte', 'Ônibus em vez de carro', 'Fui pra faculdade de ônibus e metrô em vez de pedir carro. Deu pra ler um capítulo no caminho.', 50
        UNION ALL SELECT 'gabriel@createit.com', 'Transporte', 'Ônibus em vez de carro', 'Mais um dia de transporte público.', 27
        UNION ALL SELECT 'gabriel@createit.com', 'Energia', 'Hora sem luz', 'Uma hora sem nenhuma tela à noite. Li à luz de vela e dormi mais cedo.', 8
        UNION ALL SELECT 'fernanda@createit.com', 'Reciclagem', NULL, 'As crianças pintaram as lixeiras da reciclagem. Agora todo mundo em casa quer separar o lixo.', 60
        UNION ALL SELECT 'fernanda@createit.com', 'Água', 'Rega consciente', 'Reguei a horta às 6h da manhã, antes do sol forte.', 20
        UNION ALL SELECT 'fernanda@createit.com', 'Energia', 'Desligue o que não usa', 'Coloquei filtro de linha com botão na TV e no videogame. Agora desligo tudo à noite.', 36
        UNION ALL SELECT 'fernanda@createit.com', 'Reciclagem', 'Caneca própria todo dia', 'Levei minha caneca no Café da Esquina antes da aula.', 4
        UNION ALL SELECT 'diego@createit.com', 'Transporte', 'Ônibus em vez de carro', 'Deixei o carro em casa e fui de trem até o centro.', 70
        UNION ALL SELECT 'diego@createit.com', 'Transporte', 'Ônibus em vez de carro', 'Ônibus de novo. Já descobri a linha que chega mais rápido.', 22
        UNION ALL SELECT 'diego@createit.com', 'Transporte', 'Carona solidária', 'Carona pra três colegas do trabalho hoje.', 10
        UNION ALL SELECT 'camila@createit.com', 'Água', 'Reuse a água da chuva', 'Instalei uma calha que leva a água da chuva direto pra cisterna.', 110
        UNION ALL SELECT 'camila@createit.com', 'Água', 'Reuse a água da chuva', 'Lavei o quintal só com a água da chuva guardada.', 80
        UNION ALL SELECT 'camila@createit.com', 'Água', 'Reuse a água da chuva', 'Reguei a horta toda com a água da cisterna.', 33
        UNION ALL SELECT 'camila@createit.com', 'Água', 'Reuse a água da chuva', 'A cisterna encheu de novo com a chuva de ontem. Água pra semana inteira!', 2
        UNION ALL SELECT 'camila@createit.com', 'Água', 'Rega consciente', 'Mudei a rega pro fim da tarde e coloquei cobertura de folhas secas nos canteiros.', 15
        UNION ALL SELECT 'bruno@createit.com', 'Energia', 'Desligue o que não usa', 'Troquei as últimas lâmpadas incandescentes por LED.', 90
        UNION ALL SELECT 'bruno@createit.com', 'Energia', 'Desligue o que não usa', 'Desliguei o micro-ondas e o carregador da tomada. Parece pouco, mas soma.', 40
        UNION ALL SELECT 'bruno@createit.com', 'Energia', 'Hora sem luz', 'Jantar à luz de velas com a família, tudo desligado por uma hora.', 18
        UNION ALL SELECT 'larissa@createit.com', 'Transporte', 'Pedale até o trabalho', 'Fui de bike até o coworking pela ciclovia da Faria Lima.', 55
        UNION ALL SELECT 'larissa@createit.com', 'Transporte', 'Pedale até o trabalho', 'Segundo dia de bike. Já estou viciada.', 29
        UNION ALL SELECT 'larissa@createit.com', 'Reciclagem', 'Caneca própria todo dia', 'Copo reutilizável no café da manhã.', 9
        UNION ALL SELECT 'larissa@createit.com', 'Reciclagem', 'Caneca própria todo dia', 'Caneca própria de novo. O barista já me conhece.', 1
        UNION ALL SELECT 'eduardo@createit.com', 'Energia', 'Hora sem luz', 'Desliguei o ar-condicionado e abri as janelas. Uma hora sem nada ligado.', 100
        UNION ALL SELECT 'eduardo@createit.com', 'Energia', 'Desligue o que não usa', 'Programei o desligamento automático do computador do escritório.', 48
        UNION ALL SELECT 'eduardo@createit.com', 'Energia', NULL, 'Recebi o orçamento das placas solares. Mês que vem começa a instalação!', 14
        UNION ALL SELECT 'marina@createit.com', 'Reciclagem', 'Traga seu pote', 'Feijão e lentilha a granel no pote de vidro.', 16
        UNION ALL SELECT 'marina@createit.com', 'Reciclagem', 'Caneca própria todo dia', 'Café com a minha caneca de sempre.', 5
        UNION ALL SELECT 'rafael@createit.com', 'Transporte', 'Pedale até o trabalho', 'Bike até o escritório, 8 km.', 21
        UNION ALL SELECT 'rafael@createit.com', 'Transporte', 'Carona solidária', 'Levei dois amigos pro jogo de carona.', 44
        UNION ALL SELECT 'carla@createit.com', 'Água', 'Rega consciente', 'Reguei as plantas da varanda à noite.', 13
        UNION ALL SELECT 'carla@createit.com', 'Água', 'Reuse a água da chuva', 'Balde no ralo da calha. Agora rego tudo com água da chuva.', 62
        UNION ALL SELECT 'lucas@createit.com', 'Reciclagem', 'Traga seu pote', 'Pote de sorvete reaproveitado pra comprar aveia a granel.', 35
        UNION ALL SELECT 'demo@createit.com', 'Energia', 'Desligue o que não usa', 'Tirei da tomada tudo que fica em stand-by na sala.', 11
       ) n
  JOIN usuario u        ON u.email = n.email
  JOIN categoria_acao c ON c.nome = n.categoria
  LEFT JOIN desafio d   ON d.titulo = n.desafio
 WHERE NOT EXISTS (SELECT 1 FROM postagem p WHERE p.id_usuario = u.id_usuario AND p.conteudo = n.conteudo);

-- Valida (dispara trg_creditar_pontos). No app as postagens já são validadas na hora,
-- então só as que acabaram de entrar estão pendentes.
UPDATE postagem SET status_validacao = 'validada' WHERE status_validacao = 'pendente';

UPDATE usuario SET nivel = GREATEST(nivel, 1 + pontos_ecologicos DIV 500)
 WHERE email IN ('bia@createit.com', 'thiago@createit.com', 'juliana@createit.com', 'gabriel@createit.com', 'fernanda@createit.com', 'diego@createit.com', 'camila@createit.com', 'bruno@createit.com', 'larissa@createit.com', 'eduardo@createit.com', 'cafe@createit.com', 'pedal@createit.com', 'viveiro@createit.com');

-- ------------------------------------------------------------- seguidores
INSERT IGNORE INTO seguidor (id_seguidor, id_seguido)
SELECT a.id_usuario, b.id_usuario FROM (
        SELECT 'bia@createit.com' AS de, 'juliana@createit.com' AS para
        UNION ALL SELECT 'juliana@createit.com', 'bia@createit.com'
        UNION ALL SELECT 'thiago@createit.com', 'larissa@createit.com'
        UNION ALL SELECT 'larissa@createit.com', 'thiago@createit.com'
        UNION ALL SELECT 'camila@createit.com', 'fernanda@createit.com'
        UNION ALL SELECT 'fernanda@createit.com', 'camila@createit.com'
        UNION ALL SELECT 'gabriel@createit.com', 'thiago@createit.com'
        UNION ALL SELECT 'diego@createit.com', 'gabriel@createit.com'
        UNION ALL SELECT 'bruno@createit.com', 'eduardo@createit.com'
        UNION ALL SELECT 'eduardo@createit.com', 'bruno@createit.com'
        UNION ALL SELECT 'demo@createit.com', 'bia@createit.com'
        UNION ALL SELECT 'demo@createit.com', 'thiago@createit.com'
        UNION ALL SELECT 'demo@createit.com', 'camila@createit.com'
        UNION ALL SELECT 'marina@createit.com', 'bia@createit.com'
        UNION ALL SELECT 'rafael@createit.com', 'thiago@createit.com'
        UNION ALL SELECT 'bia@createit.com', 'marina@createit.com'
        UNION ALL SELECT 'thiago@createit.com', 'rafael@createit.com'
        UNION ALL SELECT 'larissa@createit.com', 'camila@createit.com'
        UNION ALL SELECT 'juliana@createit.com', 'camila@createit.com'
        UNION ALL SELECT 'fernanda@createit.com', 'bia@createit.com'
        UNION ALL SELECT 'carla@createit.com', 'camila@createit.com'
        UNION ALL SELECT 'lucas@createit.com', 'bia@createit.com'
        UNION ALL SELECT 'bia@createit.com', 'demo@createit.com'
        UNION ALL SELECT 'thiago@createit.com', 'demo@createit.com'
       ) s JOIN usuario a ON a.email = s.de JOIN usuario b ON b.email = s.para;

-- --------------------------------------------------------------- curtidas
INSERT IGNORE INTO curtida (id_usuario, id_postagem)
SELECT u.id_usuario, p.id_postagem FROM (
        SELECT 'juliana@createit.com' AS email, 'Quarta compra sem embalagem%' AS inicio
        UNION ALL SELECT 'marina@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'demo@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'fernanda@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'lucas@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'camila@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'larissa@createit.com', 'Quarta compra sem embalagem%'
        UNION ALL SELECT 'larissa@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'rafael@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'gabriel@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'demo@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'diego@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'bia@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'eduardo@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'marina@createit.com', 'Quinto pedal da semana%'
        UNION ALL SELECT 'fernanda@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'carla@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'juliana@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'demo@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'bia@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'eduardo@createit.com', 'A cisterna encheu de novo%'
        UNION ALL SELECT 'bia@createit.com', 'Terceira e última!%'
        UNION ALL SELECT 'marina@createit.com', 'Terceira e última!%'
        UNION ALL SELECT 'camila@createit.com', 'Terceira e última!%'
        UNION ALL SELECT 'camila@createit.com', 'As crianças pintaram%'
        UNION ALL SELECT 'bia@createit.com', 'As crianças pintaram%'
        UNION ALL SELECT 'juliana@createit.com', 'As crianças pintaram%'
        UNION ALL SELECT 'demo@createit.com', 'As crianças pintaram%'
        UNION ALL SELECT 'larissa@createit.com', 'As crianças pintaram%'
        UNION ALL SELECT 'bruno@createit.com', 'Recebi o orçamento das placas%'
        UNION ALL SELECT 'gabriel@createit.com', 'Recebi o orçamento das placas%'
        UNION ALL SELECT 'thiago@createit.com', 'Recebi o orçamento das placas%'
        UNION ALL SELECT 'demo@createit.com', 'Recebi o orçamento das placas%'
        UNION ALL SELECT 'larissa@createit.com', 'Primeiro dia indo de bike%'
        UNION ALL SELECT 'rafael@createit.com', 'Primeiro dia indo de bike%'
        UNION ALL SELECT 'diego@createit.com', 'Primeiro dia indo de bike%'
        UNION ALL SELECT 'bia@createit.com', 'Montei a composteira%'
        UNION ALL SELECT 'camila@createit.com', 'Montei a composteira%'
        UNION ALL SELECT 'fernanda@createit.com', 'Montei a composteira%'
        UNION ALL SELECT 'lucas@createit.com', 'Montei a composteira%'
        UNION ALL SELECT 'marina@createit.com', 'Montei a composteira%'
        UNION ALL SELECT 'diego@createit.com', 'Uma hora sem nenhuma tela%'
        UNION ALL SELECT 'bruno@createit.com', 'Uma hora sem nenhuma tela%'
        UNION ALL SELECT 'larissa@createit.com', 'Uma hora sem nenhuma tela%'
        UNION ALL SELECT 'fernanda@createit.com', 'Instalei uma calha%'
        UNION ALL SELECT 'carla@createit.com', 'Instalei uma calha%'
        UNION ALL SELECT 'eduardo@createit.com', 'Instalei uma calha%'
        UNION ALL SELECT 'juliana@createit.com', 'Instalei uma calha%'
        UNION ALL SELECT 'thiago@createit.com', 'Fui de bike até o coworking%'
        UNION ALL SELECT 'rafael@createit.com', 'Fui de bike até o coworking%'
        UNION ALL SELECT 'gabriel@createit.com', 'Fui de bike até o coworking%'
        UNION ALL SELECT 'fernanda@createit.com', 'Caneca própria de novo%'
        UNION ALL SELECT 'marina@createit.com', 'Caneca própria de novo%'
        UNION ALL SELECT 'bia@createit.com', 'Caneca própria de novo%'
        UNION ALL SELECT 'camila@createit.com', 'Coloquei um balde no chuveiro%'
        UNION ALL SELECT 'carla@createit.com', 'Coloquei um balde no chuveiro%'
        UNION ALL SELECT 'eduardo@createit.com', 'Troquei as últimas lâmpadas%'
        UNION ALL SELECT 'demo@createit.com', 'Troquei as últimas lâmpadas%'
        UNION ALL SELECT 'thiago@createit.com', 'Carona pra três colegas%'
        UNION ALL SELECT 'gabriel@createit.com', 'Carona pra três colegas%'
        UNION ALL SELECT 'fernanda@createit.com', 'Jantar à luz de velas%'
        UNION ALL SELECT 'eduardo@createit.com', 'Jantar à luz de velas%'
        UNION ALL SELECT 'larissa@createit.com', 'Jantar à luz de velas%'
       ) c JOIN usuario u ON u.email = c.email JOIN postagem p ON p.conteudo LIKE c.inicio;

-- ------------------------------------------------------------ comentários
INSERT INTO comentario (id_usuario, id_postagem, texto)
SELECT u.id_usuario, p.id_postagem, c.texto FROM (
        SELECT 'juliana@createit.com' AS email, 'Quarta compra sem embalagem%' AS inicio, 'Parabéns, Bia! Qual pote você usa pra aveia?' AS texto
        UNION ALL SELECT 'bia@createit.com', 'Quarta compra sem embalagem%', 'Pote de vidro de 1 litro, Ju. O Empório tem de recompensa!'
        UNION ALL SELECT 'larissa@createit.com', 'Quinto pedal da semana%', 'Inspiração! Semana que vem quero completar também.'
        UNION ALL SELECT 'rafael@createit.com', 'Quinto pedal da semana%', 'Bora marcar de pedalar juntos sábado?'
        UNION ALL SELECT 'thiago@createit.com', 'Quinto pedal da semana%', 'Bora! Saindo da praça às 8h.'
        UNION ALL SELECT 'fernanda@createit.com', 'A cisterna encheu de novo%', 'Que demais! Quanto custou montar a cisterna?'
        UNION ALL SELECT 'camila@createit.com', 'A cisterna encheu de novo%', 'Uns R$ 400 com a calha. Se paga rápido na conta de água.'
        UNION ALL SELECT 'marina@createit.com', 'As crianças pintaram%', 'Que ideia linda! Vou fazer com meus sobrinhos.'
        UNION ALL SELECT 'bruno@createit.com', 'Recebi o orçamento das placas%', 'Depois me passa o contato da empresa?'
        UNION ALL SELECT 'eduardo@createit.com', 'Recebi o orçamento das placas%', 'Passo sim! Te mando por mensagem.'
        UNION ALL SELECT 'camila@createit.com', 'Montei a composteira%', 'Coloca serragem por cima que não dá cheiro nenhum.'
        UNION ALL SELECT 'diego@createit.com', 'Uma hora sem nenhuma tela%', 'Preciso fazer isso. Tô viciado no celular.'
        UNION ALL SELECT 'carla@createit.com', 'Instalei uma calha%', 'Fiz igual aqui depois de ver seu post!'
        UNION ALL SELECT 'gabriel@createit.com', 'Fui de bike até o coworking%', 'A ciclovia da Faria Lima é a melhor da cidade.'
        UNION ALL SELECT 'demo@createit.com', 'Troquei as últimas lâmpadas%', 'Fiz isso ano passado e a conta caiu bastante.'
        UNION ALL SELECT 'marina@createit.com', 'Caneca própria de novo%', 'O café de lá é ótimo!'
       ) c JOIN usuario u ON u.email = c.email JOIN postagem p ON p.conteudo LIKE c.inicio
 WHERE NOT EXISTS (SELECT 1 FROM comentario x WHERE x.id_usuario = u.id_usuario AND x.id_postagem = p.id_postagem AND x.texto = c.texto);

-- --------------------------------------------------------------- resgates
-- Mesmas regras da sp_resgatar (saldo, estoque e validade), em 4 passos para poder
-- rodar de novo sem cobrar duas vezes. O voucher entra com status 'expirado' como
-- marca de "ainda não cobrado"; os passos 2 e 3 cobram só esses; o 4 tira a marca.
-- Cada conta só resgata se tiver saldo para todos os vouchers dela de uma vez.
INSERT INTO resgate (id_usuario, id_recompensa, codigo_voucher, status, pontos_gastos, data_resgate)
SELECT u.id_usuario, r.id_recompensa, x.codigo, 'expirado', r.custo_pontos, DATE_SUB(UTC_TIMESTAMP(), INTERVAL x.horas HOUR) FROM (
        SELECT 'marina@createit.com' AS email, 'Pote de vidro de 1 litro' AS titulo, 'CRT-M4R1' AS codigo, 1050 AS total, 4 AS horas
        UNION ALL SELECT 'marina@createit.com', 'Pão de queijo com café coado', 'CRT-M4R2', 1050, 13
        UNION ALL SELECT 'rafael@createit.com', 'Aula de mecânica básica', 'CRT-R4F1', 900, 22
        UNION ALL SELECT 'lucas@createit.com', 'Pacote de sementes de horta', 'CRT-L0C1', 550, 31
        UNION ALL SELECT 'lucas@createit.com', 'Calibragem e lubrificação grátis', 'CRT-L0C2', 550, 40
        UNION ALL SELECT 'carla@createit.com', 'Pacote de sementes de horta', 'CRT-C4R1', 250, 49
        UNION ALL SELECT 'demo@createit.com', 'Sacola de algodão cru', 'CRT-D3M1', 400, 58
       ) x
  JOIN usuario u    ON u.email = x.email
  JOIN recompensa r ON r.titulo = x.titulo
 WHERE r.estoque > 0 AND r.validade >= CURRENT_DATE()
   AND u.pontos_ecologicos >= x.total
   AND NOT EXISTS (SELECT 1 FROM resgate e WHERE e.codigo_voucher = x.codigo);

UPDATE usuario u
  JOIN (SELECT id_usuario, SUM(pontos_gastos) AS total FROM resgate
         WHERE codigo_voucher IN ('CRT-M4R1', 'CRT-M4R2', 'CRT-R4F1', 'CRT-L0C1', 'CRT-L0C2', 'CRT-C4R1', 'CRT-D3M1') AND status = 'expirado'
         GROUP BY id_usuario) t ON t.id_usuario = u.id_usuario
   SET u.pontos_ecologicos = u.pontos_ecologicos - t.total;

UPDATE recompensa r
  JOIN (SELECT id_recompensa, COUNT(*) AS qtd FROM resgate
         WHERE codigo_voucher IN ('CRT-M4R1', 'CRT-M4R2', 'CRT-R4F1', 'CRT-L0C1', 'CRT-L0C2', 'CRT-C4R1', 'CRT-D3M1') AND status = 'expirado'
         GROUP BY id_recompensa) t ON t.id_recompensa = r.id_recompensa
   SET r.estoque = r.estoque - t.qtd;

-- Alguns vouchers já foram usados no balcão (aparecem como "Usado" no painel)
UPDATE resgate SET status = IF(codigo_voucher IN ('CRT-M4R1', 'CRT-M4R2', 'CRT-R4F1', 'CRT-L0C2'), 'usado', 'ativo')
 WHERE codigo_voucher IN ('CRT-M4R1', 'CRT-M4R2', 'CRT-R4F1', 'CRT-L0C1', 'CRT-L0C2', 'CRT-C4R1', 'CRT-D3M1') AND status = 'expirado';

