import { NextRequest, NextResponse } from "next/server";

const FOODS = [
  // ── CAFÉ ──
  { id: 1, name: "Pão francês", calories: 150, type: "Café" },
  { id: 2, name: "Pão de queijo (1 unid.)", calories: 90, type: "Café" },
  { id: 3, name: "Ovo mexido (2 ovos)", calories: 180, type: "Café" },
  { id: 4, name: "Ovo cozido (1 unid.)", calories: 78, type: "Café" },
  { id: 5, name: "Tapioca simples", calories: 160, type: "Café" },
  { id: 6, name: "Tapioca com queijo", calories: 230, type: "Café" },
  { id: 7, name: "Iogurte natural (200g)", calories: 120, type: "Café" },
  { id: 8, name: "Iogurte grego (100g)", calories: 110, type: "Café" },
  { id: 9, name: "Aveia (40g)", calories: 150, type: "Café" },
  { id: 10, name: "Banana (1 unid.)", calories: 90, type: "Café" },
  { id: 11, name: "Mamão (1 fatia)", calories: 60, type: "Café" },
  { id: 12, name: "Leite integral (200ml)", calories: 120, type: "Café" },
  { id: 13, name: "Café com leite (200ml)", calories: 80, type: "Café" },
  { id: 14, name: "Queijo minas (1 fatia)", calories: 70, type: "Café" },
  { id: 15, name: "Presunto (2 fatias)", calories: 60, type: "Café" },
  { id: 16, name: "Manteiga (1 col. chá)", calories: 35, type: "Café" },
  { id: 17, name: "Granola (40g)", calories: 180, type: "Café" },
  { id: 18, name: "Bolo simples (1 fatia)", calories: 220, type: "Café" },

  // ── ALMOÇO ──
  { id: 19, name: "Arroz branco (4 col.)", calories: 240, type: "Almoço" },
  { id: 20, name: "Arroz integral (4 col.)", calories: 220, type: "Almoço" },
  { id: 21, name: "Feijão carioca (1 concha)", calories: 180, type: "Almoço" },
  { id: 22, name: "Feijão preto (1 concha)", calories: 170, type: "Almoço" },
  { id: 23, name: "Frango grelhado (150g)", calories: 230, type: "Almoço" },
  { id: 24, name: "Frango assado (150g)", calories: 250, type: "Almoço" },
  { id: 25, name: "Carne bovina grelhada (150g)", calories: 300, type: "Almoço" },
  { id: 26, name: "Carne moída refogada (100g)", calories: 220, type: "Almoço" },
  { id: 27, name: "Peixe grelhado (150g)", calories: 200, type: "Almoço" },
  { id: 28, name: "Salmão grelhado (150g)", calories: 280, type: "Almoço" },
  { id: 29, name: "Atum em lata (100g)", calories: 130, type: "Almoço" },
  { id: 30, name: "Macarrão ao sugo (200g)", calories: 300, type: "Almoço" },
  { id: 31, name: "Macarrão à bolonhesa (200g)", calories: 380, type: "Almoço" },
  { id: 32, name: "Salada verde (1 prato)", calories: 40, type: "Almoço" },
  { id: 33, name: "Salada com tomate (1 prato)", calories: 55, type: "Almoço" },
  { id: 34, name: "Batata cozida (1 unid. média)", calories: 130, type: "Almoço" },
  { id: 35, name: "Batata frita (porção peq.)", calories: 320, type: "Almoço" },
  { id: 36, name: "Mandioca cozida (100g)", calories: 140, type: "Almoço" },
  { id: 37, name: "Farofa (3 col.)", calories: 180, type: "Almoço" },
  { id: 38, name: "Purê de batata (100g)", calories: 120, type: "Almoço" },
  { id: 39, name: "Couve refogada (2 col.)", calories: 45, type: "Almoço" },
  { id: 40, name: "Brócolis cozido (100g)", calories: 35, type: "Almoço" },

  // ── JANTAR ──
  { id: 41, name: "Sopa de legumes (1 tigela)", calories: 150, type: "Jantar" },
  { id: 42, name: "Sopa de frango (1 tigela)", calories: 220, type: "Jantar" },
  { id: 43, name: "Omelete (2 ovos)", calories: 200, type: "Jantar" },
  { id: 44, name: "Omelete com queijo (2 ovos)", calories: 260, type: "Jantar" },
  { id: 45, name: "Frango grelhado (150g)", calories: 230, type: "Jantar" },
  { id: 46, name: "Peixe assado (150g)", calories: 210, type: "Jantar" },
  { id: 47, name: "Arroz com frango (prato)", calories: 420, type: "Jantar" },
  { id: 48, name: "Salada com atum (prato)", calories: 200, type: "Jantar" },
  { id: 49, name: "Wrap de frango", calories: 350, type: "Jantar" },
  { id: 50, name: "Pizza (1 fatia)", calories: 280, type: "Jantar" },
  { id: 51, name: "Hambúrguer caseiro", calories: 450, type: "Jantar" },
  { id: 52, name: "Macarrão integral (200g)", calories: 280, type: "Jantar" },
  { id: 53, name: "Legumes refogados (100g)", calories: 80, type: "Jantar" },
  { id: 54, name: "Iogurte com granola", calories: 220, type: "Jantar" },
  { id: 55, name: "Tapioca com frango", calories: 300, type: "Jantar" },

  // ── LANCHE ──
  { id: 56, name: "Maçã (1 unid.)", calories: 80, type: "Lanche" },
  { id: 57, name: "Banana (1 unid.)", calories: 90, type: "Lanche" },
  { id: 58, name: "Laranja (1 unid.)", calories: 65, type: "Lanche" },
  { id: 59, name: "Uva (1 cacho peq.)", calories: 100, type: "Lanche" },
  { id: 60, name: "Castanha-do-pará (5 unid.)", calories: 130, type: "Lanche" },
  { id: 61, name: "Amendoim (30g)", calories: 170, type: "Lanche" },
  { id: 62, name: "Mix de nuts (30g)", calories: 180, type: "Lanche" },
  { id: 63, name: "Barra de proteína", calories: 200, type: "Lanche" },
  { id: 64, name: "Biscoito de arroz (3 unid.)", calories: 100, type: "Lanche" },
  { id: 65, name: "Biscoito integral (5 unid.)", calories: 120, type: "Lanche" },
  { id: 66, name: "Queijo minas (2 fatias)", calories: 140, type: "Lanche" },
  { id: 67, name: "Iogurte natural (200g)", calories: 120, type: "Lanche" },
  { id: 68, name: "Vitamina de banana (300ml)", calories: 250, type: "Lanche" },
  { id: 69, name: "Suco de laranja natural (300ml)", calories: 140, type: "Lanche" },
  { id: 70, name: "Whey protein (1 dose)", calories: 120, type: "Lanche" },
  { id: 71, name: "Tapioca simples", calories: 160, type: "Lanche" },
  { id: 72, name: "Pão integral (1 fatia)", calories: 70, type: "Lanche" },
  { id: 73, name: "Chocolate amargo (2 quadr.)", calories: 110, type: "Lanche" },
  { id: 74, name: "Pipoca sem manteiga (30g)", calories: 110, type: "Lanche" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = searchParams.get("q")?.toLowerCase();

  let result = FOODS;

  if (type && type !== "all") {
    result = result.filter(f => f.type === type);
  }

  if (query) {
    result = result.filter(f => f.name.toLowerCase().includes(query));
  }

  return NextResponse.json(result);
}