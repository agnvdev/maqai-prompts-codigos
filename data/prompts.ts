import type { Prompt } from "@/lib/types";

export const prompts: Prompt[] = [
  {
    id: "machinebreakdown",
    code: "/machinebreakdown",
    title: "Diagnóstico Visual de Quebra",
    description:
      "Mostra o componente exato que falhou dentro da máquina, em corte técnico e realista.",
    category: "Máquinas",
    segment: "Máquinas Pesadas",
    type: "Imagem",
    tools: ["Midjourney", "DALL-E"],
    prompt:
      "Corte técnico realista de uma [escavadeira/trator/caminhão fora de estrada], revelando o componente interno danificado ([motor/transmissão/hidráulico]) em destaque, iluminação de estúdio industrial, fundo cinza-grafite, estilo diagrama técnico premium, ultra detalhado, 8k --ar 3:4",
    featured: true,
    tags: ["Essenciais", "Máquinas", "Imagem", "Códigos"],
  },
  {
    id: "darkpremium",
    code: "/darkpremium",
    title: "Estúdio Dark Premium",
    description:
      "Retrato de produto em fundo escuro premium, com o brilho da máquina em destaque total.",
    category: "Essenciais",
    segment: "Geral",
    type: "Imagem",
    tools: ["Midjourney", "Adobe Firefly"],
    prompt:
      "Fotografia de produto de uma [máquina pesada/implemento agrícola], fundo preto grafite com gradiente sutil, luz lateral dramática destacando a lataria e os detalhes metálicos, reflexo suave no piso, estética premium de showroom, alta definição, 8k --ar 16:9",
    featured: true,
    tags: ["Essenciais", "Imagem", "Máquinas", "Códigos"],
  },
  {
    id: "xraymachine",
    code: "/xraymachine",
    title: "Raio-X da Máquina",
    description:
      "Visualização estilo raio-X mostrando toda a engenharia interna da máquina em camadas.",
    category: "Máquinas",
    segment: "Máquinas Pesadas",
    type: "Imagem",
    tools: ["Midjourney"],
    prompt:
      "Ilustração estilo raio-X (X-ray view) de uma [máquina pesada], mostrando estrutura interna, motor, engrenagens e sistema hidráulico em camadas translúcidas azul-ciano sobre fundo preto, estética técnica futurista, alto contraste, 8k --ar 16:9",
    featured: false,
    tags: ["Máquinas", "Imagem", "Códigos"],
  },
  {
    id: "mudpower",
    code: "/mudpower",
    title: "Poder na Lama",
    description:
      "Cena de força bruta com a máquina atravessando lama pesada em movimento intenso.",
    category: "Agro",
    segment: "Agro",
    type: "Vídeo",
    tools: ["Runway", "Pika Labs"],
    prompt:
      "Vídeo cinematográfico em câmera lenta de [trator/colheitadeira/caminhão] atravessando lama espessa, respingos realistas voando em todas as direções, pneus girando com força total, luz dourada de fim de tarde, som de motor grave, 4k, 24fps",
    featured: true,
    tags: ["Agro", "Vídeo", "Mineração"],
  },
  {
    id: "nightoperation",
    code: "/nightoperation",
    title: "Operação Noturna",
    description:
      "Máquina pesada operando à noite, faróis acesos, atmosfera industrial intensa.",
    category: "Mineração",
    segment: "Mineração",
    type: "Vídeo",
    tools: ["Runway", "Sora"],
    prompt:
      "Vídeo cinematográfico noturno de [caminhão fora de estrada/escavadeira] operando em mina a céu aberto, faróis potentes cortando a poeira no ar, faíscas e poeira iluminadas, câmera baixa em contra-plongée, atmosfera épica e industrial, 4k",
    featured: false,
    tags: ["Mineração", "Vídeo"],
  },
  {
    id: "explodedview",
    code: "/explodedview",
    title: "Vista Explodida 3D",
    description:
      "Todas as peças da máquina flutuando organizadas, estilo manual técnico 3D premium.",
    category: "Máquinas",
    segment: "Máquinas Pesadas",
    type: "Imagem",
    tools: ["Midjourney", "Blender"],
    prompt:
      "Vista explodida (exploded view) em 3D de uma [máquina pesada/motor diesel], todas as peças flutuando organizadas no espaço com linhas guia sutis, fundo cinza-grafite gradiente, render estilo manual técnico premium, iluminação de estúdio, 8k --ar 1:1",
    featured: true,
    tags: ["Máquinas", "Imagem", "Essenciais"],
  },
  {
    id: "cinematic",
    code: "/cinematic",
    title: "Cena Cinematográfica",
    description:
      "Abertura de vídeo estilo cinema para apresentar a máquina como protagonista.",
    category: "Essenciais",
    segment: "Geral",
    type: "Vídeo",
    tools: ["Runway", "Sora"],
    prompt:
      "Sequência de abertura cinematográfica de [máquina pesada] revelada em contraluz ao amanhecer, câmera em movimento lento tipo drone descendo, poeira suspensa no ar, trilha sonora épica implícita, color grading dark premium com destaque em amarelo, 4k, formato vertical 9:16",
    featured: true,
    tags: ["Essenciais", "Vídeo", "Instagram"],
  },
  {
    id: "agro",
    code: "/agro",
    title: "Poder do Agro",
    description:
      "Colheitadeira ou trator em cena épica de plantação ao pôr do sol.",
    category: "Agro",
    segment: "Agro",
    type: "Imagem",
    tools: ["Midjourney"],
    prompt:
      "Fotografia épica de [colheitadeira/trator] em plantação extensa durante o pôr do sol, poeira dourada suspensa no ar, céu dramático em tons laranja e roxo, ângulo baixo heroico, ultra realista, 8k --ar 16:9",
    featured: true,
    tags: ["Agro", "Imagem", "Essenciais"],
  },
  {
    id: "miningpower",
    code: "/miningpower",
    title: "Força da Mineração",
    description:
      "Caminhão fora de estrada gigante em cena de mineração de grande escala.",
    category: "Mineração",
    segment: "Mineração",
    type: "Imagem",
    tools: ["Midjourney", "Leonardo AI"],
    prompt:
      "Fotografia industrial de [caminhão fora de estrada de mineração] gigante em mina a céu aberto, escala monumental, poeira e nuvens de fundo, luz dura de meio-dia, cores terrosas e metálicas, extremamente detalhado, 8k --ar 16:9",
    featured: false,
    tags: ["Mineração", "Imagem"],
  },
  {
    id: "heavyduty",
    code: "/heavyduty",
    title: "Heavy Duty Extremo",
    description:
      "Máquina suja, arranhada e extrema, transmitindo resistência e trabalho pesado.",
    category: "Máquinas",
    segment: "Máquinas Pesadas",
    type: "Imagem",
    tools: ["Midjourney"],
    prompt:
      "Fotografia realista de [máquina pesada] coberta de lama e poeira após jornada extrema de trabalho, arranhões e desgaste visíveis na lataria, ambiente de obra pesada ao fundo desfocado, luz dura lateral, estética heavy-duty, 8k --ar 4:5",
    featured: false,
    tags: ["Máquinas", "Imagem", "Essenciais"],
  },
  {
    id: "viralreel",
    code: "/viralreel",
    title: "Reel Viral de Máquina",
    description:
      "Roteiro completo pronto para gravar um reel de máquina pesada que viraliza no Instagram.",
    category: "Combos",
    segment: "Geral",
    type: "Texto",
    tools: ["ChatGPT", "CapCut"],
    prompt:
      "Crie um roteiro de reel de 30 segundos para Instagram sobre [tipo de máquina], com gancho nos primeiros 2 segundos, 3 cortes de cena mostrando força/velocidade/detalhe técnico, legenda com CTA para orçamento, e sugestão de música em alta. Tom: impactante, direto, sem enrolação.",
    featured: true,
    tags: ["Vídeo", "Instagram", "Combos", "Códigos"],
  },
  {
    id: "machinesales",
    code: "/machinesales",
    title: "Anúncio de Venda de Máquina",
    description:
      "Texto de anúncio persuasivo pronto para vender a máquina em qualquer canal.",
    category: "Vendas",
    segment: "Máquinas Pesadas",
    type: "Texto",
    tools: ["ChatGPT"],
    prompt:
      "Escreva um anúncio de venda persuasivo para [modelo da máquina], destacando estado de conservação, horas de uso, diferenciais técnicos e urgência de compra. Inclua título chamativo, 3 bullets de benefícios e uma chamada final para contato via WhatsApp.",
    featured: true,
    tags: ["Vendas", "Combos", "Códigos"],
  },
];

export const categories: Prompt["category"][] = [
  "Essenciais",
  "Máquinas",
  "Agro",
  "Mineração",
  "Vendas",
  "Combos",
];

export function getPromptById(id: string): Prompt | undefined {
  return prompts.find((p) => p.id === id);
}
