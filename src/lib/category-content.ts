// SEO copy for the server-rendered category pages (/categoria/[slug]).
// Mexican Spanish, B2B oriented. Keep intros natural (100–150 words).

export type CategoryContent = {
  title: string // H1 / page title base
  h1: string
  intro: string
  metaDescription: string
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  bebidas: {
    title: 'Termos y Bebidas Promocionales',
    h1: 'Termos y Bebidas Promocionales Personalizados',
    intro:
      'Los artículos para bebidas son de los regalos promocionales más usados y apreciados en México, porque acompañan a tu cliente todos los días. En esta categoría encuentras termos, botellas, tazas, vasos y cilindros listos para personalizar con el logotipo de tu empresa mediante grabado láser, serigrafía o impresión full color. Trabajamos con precios de mayoreo pensados para empresas: entre más piezas, mejor tu costo por unidad. Son ideales para kits de bienvenida, regalos corporativos de fin de año, ferias comerciales y campañas de marketing donde buscas una presencia de marca duradera. Realizamos envíos a toda la República Mexicana y te entregamos un mockup digital con tu logo antes de producir. Solicita tu cotización y recibe precio, tiempos y opciones de personalización el mismo día hábil.',
    metaDescription:
      'Termos, botellas y tazas promocionales personalizados con tu logo. Precios de mayoreo, envíos a todo México y mockup gratis. Cotiza el mismo día.',
  },
  escritura: {
    title: 'Bolígrafos y Artículos de Escritura',
    h1: 'Bolígrafos y Artículos de Escritura Promocionales',
    intro:
      'Los bolígrafos y artículos de escritura siguen siendo el regalo promocional más rentable para posicionar tu marca: bajo costo por pieza y altísima rotación en oficinas, eventos y puntos de venta. Aquí encuentras plumas metálicas y plásticas, lápices, sets de escritura y marcadores, todos personalizables con el logotipo de tu empresa mediante tampografía, grabado láser o impresión a color. Manejamos precios por volumen ideales para tirajes altos, perfectos para congresos, capacitaciones, ferias comerciales y campañas masivas de marketing. Cada pedido incluye la revisión de un mockup digital con tu logo antes de imprimir, y realizamos envíos a toda la República Mexicana. Cotiza en línea y recibe precio de mayoreo, tiempos de entrega y técnicas de personalización disponibles el mismo día hábil.',
    metaDescription:
      'Bolígrafos, plumas y artículos de escritura personalizados con tu logo. Precios por volumen, envíos a todo México. Cotiza gratis el mismo día.',
  },
  tecnologia: {
    title: 'Tecnología y Gadgets Promocionales',
    h1: 'Tecnología y Gadgets Promocionales Personalizados',
    intro:
      'Los gadgets tecnológicos son el regalo corporativo que más impresiona y que tu cliente conserva por más tiempo. En esta categoría encuentras memorias USB, power banks, bocinas, audífonos, cargadores inalámbricos y accesorios electrónicos listos para personalizar con el logotipo de tu empresa mediante grabado láser o impresión a color. Ofrecemos precios de mayoreo escalonados para empresas y son perfectos para regalos ejecutivos, premios, kits de bienvenida para nuevos empleados y stands en ferias comerciales. Antes de producir te enviamos un mockup digital con tu marca para tu aprobación, y despachamos pedidos a toda la República Mexicana. Solicita tu cotización y recibe precio por volumen, disponibilidad y opciones de personalización el mismo día hábil.',
    metaDescription:
      'USB, power banks, bocinas y gadgets promocionales personalizados con tu logo. Precios de mayoreo y envíos a todo México. Cotiza el mismo día.',
  },
  bolsas: {
    title: 'Bolsas y Mochilas Promocionales',
    h1: 'Bolsas y Mochilas Promocionales Personalizadas',
    intro:
      'Las bolsas promocionales convierten a tu cliente en un anuncio andante: son de los artículos con mayor visibilidad y mejor costo por impacto. Aquí encuentras bolsas ecológicas, tote bags, mochilas, maletas y bolsas para eventos, todas personalizables con el logotipo de tu empresa mediante serigrafía, sublimación o bordado. Manejamos precios de mayoreo pensados para empresas y son ideales para ferias comerciales, congresos, kits de bienvenida y campañas de sustentabilidad. Cada pedido incluye un mockup digital con tu logo para aprobación antes de producir, y realizamos envíos a toda la República Mexicana. Cotiza en línea y recibe precio por volumen, tiempos de entrega y las técnicas de personalización disponibles para cada modelo el mismo día hábil.',
    metaDescription:
      'Bolsas ecológicas, tote bags y mochilas promocionales personalizadas con tu logo. Precios de mayoreo, envíos a todo México. Cotiza gratis.',
  },
  oficina: {
    title: 'Artículos de Oficina Promocionales',
    h1: 'Artículos de Oficina Promocionales Personalizados',
    intro:
      'Los artículos de oficina mantienen tu marca presente en el escritorio de tu cliente durante todo el año. En esta categoría encuentras libretas, cuadernos, agendas, portafolios, calendarios y organizadores listos para personalizar con el logotipo de tu empresa mediante grabado, serigrafía o impresión a color. Ofrecemos precios de mayoreo para empresas y son perfectos para juntas ejecutivas, capacitaciones, kits de bienvenida y regalos corporativos de fin de año. Antes de imprimir te compartimos un mockup digital con tu marca para tu aprobación, y despachamos a toda la República Mexicana. Solicita tu cotización y recibe precio por volumen, disponibilidad y opciones de personalización el mismo día hábil.',
    metaDescription:
      'Libretas, agendas y artículos de oficina promocionales personalizados con tu logo. Precios de mayoreo y envíos a todo México. Cotiza gratis.',
  },
  llaveros: {
    title: 'Llaveros Promocionales',
    h1: 'Llaveros Promocionales Personalizados',
    intro:
      'Los llaveros son el regalo promocional de bolsillo por excelencia: económicos, útiles y con una vida útil larguísima que mantiene tu logo a la vista todos los días. Aquí encuentras llaveros metálicos, de plástico, de piel y multifuncionales, personalizables con el logotipo de tu empresa mediante grabado láser, tampografía o resina. Trabajamos con precios de mayoreo ideales para tirajes altos, perfectos para ferias comerciales, promociones en punto de venta, eventos masivos y campañas de marketing de bajo costo. Cada pedido incluye un mockup digital con tu marca antes de producir, y realizamos envíos a toda la República Mexicana. Cotiza en línea y recibe precio por volumen, tiempos de entrega y técnicas de personalización el mismo día hábil.',
    metaDescription:
      'Llaveros promocionales personalizados con tu logo: metálicos, de piel y más. Precios de mayoreo, envíos a todo México. Cotiza gratis.',
  },
  sets: {
    title: 'Sets y Kits Promocionales',
    h1: 'Sets y Kits Promocionales Personalizados',
    intro:
      'Los sets y kits promocionales elevan la percepción de tu marca: al agrupar varios artículos en un empaque cuidado, transmiten un regalo de mayor valor. En esta categoría encuentras sets de escritura, kits de vino, sets ejecutivos, kits de bienvenida y estuches multiusos, todos personalizables con el logotipo de tu empresa mediante grabado, serigrafía o impresión a color. Manejamos precios de mayoreo para empresas y son ideales para regalos ejecutivos, premios de reconocimiento, onboarding de nuevos empleados y clientes VIP. Antes de producir te enviamos un mockup digital con tu marca para tu aprobación, y despachamos a toda la República Mexicana. Solicita tu cotización y recibe precio por volumen, disponibilidad y opciones de personalización el mismo día hábil.',
    metaDescription:
      'Sets y kits promocionales personalizados con tu logo para regalos ejecutivos. Precios de mayoreo, envíos a todo México. Cotiza gratis.',
  },
  navidad: {
    title: 'Regalos Navideños Corporativos',
    h1: 'Regalos Navideños Corporativos Personalizados',
    intro:
      'Los regalos navideños corporativos son la mejor oportunidad del año para agradecer a clientes y colaboradores, y reforzar la relación con tu marca. Aquí encuentras esferas, kits navideños, artículos decorativos y regalos de fin de año listos para personalizar con el logotipo de tu empresa mediante grabado, serigrafía o impresión a color. Ofrecemos precios de mayoreo pensados para empresas y planeamos contigo los tiempos de producción para que llegues a tiempo a la temporada. Son perfectos para posadas, regalos a clientes clave, reconocimientos a empleados y campañas de fin de año. Cada pedido incluye un mockup digital con tu marca y envíos a toda la República Mexicana. Cotiza con anticipación y asegura disponibilidad, precio por volumen y entrega en tiempo.',
    metaDescription:
      'Regalos navideños corporativos personalizados con tu logo. Precios de mayoreo, envíos a todo México y entrega a tiempo. Cotiza con anticipación.',
  },
  paraguas: {
    title: 'Paraguas e Impermeables Promocionales',
    h1: 'Paraguas e Impermeables Promocionales Personalizados',
    intro:
      'Los paraguas promocionales combinan gran superficie de marca con un uso constante en temporada de lluvias, logrando una visibilidad difícil de igualar. En esta categoría encuentras paraguas automáticos, sombrillas, impermeables y ponchos personalizables con el logotipo de tu empresa mediante serigrafía o sublimación a todo color. Manejamos precios de mayoreo para empresas y son ideales para eventos al aire libre, activaciones de marca, ferias comerciales y regalos corporativos prácticos. Antes de producir te compartimos un mockup digital con tu marca para tu aprobación, y realizamos envíos a toda la República Mexicana. Solicita tu cotización y recibe precio por volumen, tiempos de entrega y las técnicas de personalización disponibles para cada modelo el mismo día hábil.',
    metaDescription:
      'Paraguas e impermeables promocionales personalizados con tu logo. Gran área de marca, precios de mayoreo y envíos a todo México. Cotiza gratis.',
  },
  decoracion: {
    title: 'Artículos de Decoración Promocionales',
    h1: 'Artículos de Decoración Promocionales Personalizados',
    intro:
      'Los artículos de decoración mantienen tu marca presente en el espacio de trabajo o el hogar de tu cliente con un enfoque más estético y duradero. Aquí encuentras cuadros, portarretratos, relojes, artículos de escritorio y detalles decorativos personalizables con el logotipo de tu empresa mediante grabado, sublimación o impresión a color. Ofrecemos precios de mayoreo para empresas y son ideales para regalos ejecutivos, reconocimientos, aniversarios corporativos y detalles para clientes VIP. Cada pedido incluye un mockup digital con tu marca para aprobación antes de producir, y despachamos a toda la República Mexicana. Solicita tu cotización y recibe precio por volumen, disponibilidad y opciones de personalización el mismo día hábil.',
    metaDescription:
      'Artículos de decoración promocionales personalizados con tu logo. Precios de mayoreo, envíos a todo México y mockup gratis. Cotiza el mismo día.',
  },
}
