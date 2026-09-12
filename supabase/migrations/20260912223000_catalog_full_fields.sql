-- Extend prompts with the remaining fields the app already uses, and seed
-- the current static catalog so Supabase fully backs the library UI.

alter table public.prompts
  add column if not exists prompt_text text,
  add column if not exists segment text,
  add column if not exists type text,
  add column if not exists tools text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists featured boolean not null default false;

alter table public.prompts
  drop constraint if exists prompts_segment_check;
alter table public.prompts
  add constraint prompts_segment_check
  check (segment is null or segment in ('Geral', 'Máquinas Pesadas', 'Agro', 'Mineração'));

alter table public.prompts
  drop constraint if exists prompts_type_check;
alter table public.prompts
  add constraint prompts_type_check
  check (type is null or type in ('Imagem', 'Vídeo', 'Texto'));

-- Seed categories
insert into public.categories (name) values
  ('Essenciais'),
  ('Máquinas'),
  ('Agro'),
  ('Mineração'),
  ('Vendas'),
  ('Combos')
on conflict (name) do nothing;

-- Seed prompts (mirrors data/prompts.ts)
insert into public.prompts
  (code, title, description, category_id, segment, type, tools, prompt_text, featured, tags, is_premium, is_active)
values
  (
    '/machinebreakdown', 'Diagnóstico Visual de Quebra',
    'Mostra o componente exato que falhou dentro da máquina, em corte técnico e realista.',
    (select id from public.categories where name = 'Máquinas'),
    'Máquinas Pesadas', 'Imagem', array['Midjourney', 'DALL-E'],
    'Corte técnico realista de uma [escavadeira/trator/caminhão fora de estrada], revelando o componente interno danificado ([motor/transmissão/hidráulico]) em destaque, iluminação de estúdio industrial, fundo cinza-grafite, estilo diagrama técnico premium, ultra detalhado, 8k --ar 3:4',
    true, array['Essenciais', 'Máquinas', 'Imagem', 'Códigos'], false, true
  ),
  (
    '/darkpremium', 'Estúdio Dark Premium',
    'Retrato de produto em fundo escuro premium, com o brilho da máquina em destaque total.',
    (select id from public.categories where name = 'Essenciais'),
    'Geral', 'Imagem', array['Midjourney', 'Adobe Firefly'],
    'Fotografia de produto de uma [máquina pesada/implemento agrícola], fundo preto grafite com gradiente sutil, luz lateral dramática destacando a lataria e os detalhes metálicos, reflexo suave no piso, estética premium de showroom, alta definição, 8k --ar 16:9',
    true, array['Essenciais', 'Imagem', 'Máquinas', 'Códigos'], false, true
  ),
  (
    '/xraymachine', 'Raio-X da Máquina',
    'Visualização estilo raio-X mostrando toda a engenharia interna da máquina em camadas.',
    (select id from public.categories where name = 'Máquinas'),
    'Máquinas Pesadas', 'Imagem', array['Midjourney'],
    'Ilustração estilo raio-X (X-ray view) de uma [máquina pesada], mostrando estrutura interna, motor, engrenagens e sistema hidráulico em camadas translúcidas azul-ciano sobre fundo preto, estética técnica futurista, alto contraste, 8k --ar 16:9',
    false, array['Máquinas', 'Imagem', 'Códigos'], false, true
  ),
  (
    '/mudpower', 'Poder na Lama',
    'Cena de força bruta com a máquina atravessando lama pesada em movimento intenso.',
    (select id from public.categories where name = 'Agro'),
    'Agro', 'Vídeo', array['Runway', 'Pika Labs'],
    'Vídeo cinematográfico em câmera lenta de [trator/colheitadeira/caminhão] atravessando lama espessa, respingos realistas voando em todas as direções, pneus girando com força total, luz dourada de fim de tarde, som de motor grave, 4k, 24fps',
    true, array['Agro', 'Vídeo', 'Mineração'], false, true
  ),
  (
    '/nightoperation', 'Operação Noturna',
    'Máquina pesada operando à noite, faróis acesos, atmosfera industrial intensa.',
    (select id from public.categories where name = 'Mineração'),
    'Mineração', 'Vídeo', array['Runway', 'Sora'],
    'Vídeo cinematográfico noturno de [caminhão fora de estrada/escavadeira] operando em mina a céu aberto, faróis potentes cortando a poeira no ar, faíscas e poeira iluminadas, câmera baixa em contra-plongée, atmosfera épica e industrial, 4k',
    false, array['Mineração', 'Vídeo'], false, true
  ),
  (
    '/explodedview', 'Vista Explodida 3D',
    'Todas as peças da máquina flutuando organizadas, estilo manual técnico 3D premium.',
    (select id from public.categories where name = 'Máquinas'),
    'Máquinas Pesadas', 'Imagem', array['Midjourney', 'Blender'],
    'Vista explodida (exploded view) em 3D de uma [máquina pesada/motor diesel], todas as peças flutuando organizadas no espaço com linhas guia sutis, fundo cinza-grafite gradiente, render estilo manual técnico premium, iluminação de estúdio, 8k --ar 1:1',
    true, array['Máquinas', 'Imagem', 'Essenciais'], false, true
  ),
  (
    '/cinematic', 'Cena Cinematográfica',
    'Abertura de vídeo estilo cinema para apresentar a máquina como protagonista.',
    (select id from public.categories where name = 'Essenciais'),
    'Geral', 'Vídeo', array['Runway', 'Sora'],
    'Sequência de abertura cinematográfica de [máquina pesada] revelada em contraluz ao amanhecer, câmera em movimento lento tipo drone descendo, poeira suspensa no ar, trilha sonora épica implícita, color grading dark premium com destaque em amarelo, 4k, formato vertical 9:16',
    true, array['Essenciais', 'Vídeo', 'Instagram'], false, true
  ),
  (
    '/agro', 'Poder do Agro',
    'Colheitadeira ou trator em cena épica de plantação ao pôr do sol.',
    (select id from public.categories where name = 'Agro'),
    'Agro', 'Imagem', array['Midjourney'],
    'Fotografia épica de [colheitadeira/trator] em plantação extensa durante o pôr do sol, poeira dourada suspensa no ar, céu dramático em tons laranja e roxo, ângulo baixo heroico, ultra realista, 8k --ar 16:9',
    true, array['Agro', 'Imagem', 'Essenciais'], false, true
  ),
  (
    '/miningpower', 'Força da Mineração',
    'Caminhão fora de estrada gigante em cena de mineração de grande escala.',
    (select id from public.categories where name = 'Mineração'),
    'Mineração', 'Imagem', array['Midjourney', 'Leonardo AI'],
    'Fotografia industrial de [caminhão fora de estrada de mineração] gigante em mina a céu aberto, escala monumental, poeira e nuvens de fundo, luz dura de meio-dia, cores terrosas e metálicas, extremamente detalhado, 8k --ar 16:9',
    false, array['Mineração', 'Imagem'], false, true
  ),
  (
    '/heavyduty', 'Heavy Duty Extremo',
    'Máquina suja, arranhada e extrema, transmitindo resistência e trabalho pesado.',
    (select id from public.categories where name = 'Máquinas'),
    'Máquinas Pesadas', 'Imagem', array['Midjourney'],
    'Fotografia realista de [máquina pesada] coberta de lama e poeira após jornada extrema de trabalho, arranhões e desgaste visíveis na lataria, ambiente de obra pesada ao fundo desfocado, luz dura lateral, estética heavy-duty, 8k --ar 4:5',
    false, array['Máquinas', 'Imagem', 'Essenciais'], false, true
  ),
  (
    '/viralreel', 'Reel Viral de Máquina',
    'Roteiro completo pronto para gravar um reel de máquina pesada que viraliza no Instagram.',
    (select id from public.categories where name = 'Combos'),
    'Geral', 'Texto', array['ChatGPT', 'CapCut'],
    'Crie um roteiro de reel de 30 segundos para Instagram sobre [tipo de máquina], com gancho nos primeiros 2 segundos, 3 cortes de cena mostrando força/velocidade/detalhe técnico, legenda com CTA para orçamento, e sugestão de música em alta. Tom: impactante, direto, sem enrolação.',
    true, array['Vídeo', 'Instagram', 'Combos', 'Códigos'], false, true
  ),
  (
    '/machinesales', 'Anúncio de Venda de Máquina',
    'Texto de anúncio persuasivo pronto para vender a máquina em qualquer canal.',
    (select id from public.categories where name = 'Vendas'),
    'Máquinas Pesadas', 'Texto', array['ChatGPT'],
    'Escreva um anúncio de venda persuasivo para [modelo da máquina], destacando estado de conservação, horas de uso, diferenciais técnicos e urgência de compra. Inclua título chamativo, 3 bullets de benefícios e uma chamada final para contato via WhatsApp.',
    true, array['Vendas', 'Combos', 'Códigos'], false, true
  )
on conflict (code) do nothing;
