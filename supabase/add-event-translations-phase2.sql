-- Phase 2: write the Spanish translation for every real event.
-- Run this whole block in the Supabase SQL Editor.

update public.events set title_es = 'Brunch + Pintura de Cerámica',
  description_es = 'El primer círculo de Nomaya. Una mañana de domingo de brunch y pintura de cerámica en buena compañía. Grupo reducido, ambiente íntimo.'
  where id = '1c621884-e228-43a8-ac52-05954cd81427';

update public.events set title_es = 'Taller de Joyería y Vino',
  description_es = 'Próximamente en marzo — una tarde de creación de joyas y vino. Más detalles pronto.'
  where id = 'e67cdc3c-9e05-489e-b03c-c3a5ed6a8f91';

update public.events set title_es = 'Vinyasa Holístico y Brunch Ligero',
  description_es = 'Una sesión consciente de vinyasa seguida de un brunch ligero y nutritivo. Muévete, respira y conecta con mujeres afines en un precioso espacio de Madrid.'
  where id = '59ee9362-9780-415d-a5a1-ce4241a2c2c9';

update public.events set title_es = 'Nomaya Dinner Club',
  description_es = 'Una cena seleccionada para 8 mujeres en uno de los bares de vinos con más encanto de Madrid. Buena comida, buen vino, mejores conversaciones. El pago se realiza en el lugar la misma noche — aquí solo reservas tu plaza.'
  where id = '85ebd488-aef5-414e-98a9-0d3cbdad0c63';

update public.events set title_es = 'Ruta a Caballo',
  description_es = 'Una tarde a caballo por las afueras de Madrid. No hace falta experiencia — solo ganas de aventura y buena compañía. Punto de encuentro: Núñez de Balboa 114.'
  where id = '6f016ae0-ab2d-4b75-8ae5-9cf5e10735f3';

update public.events set title_es = 'Noche de Cine: El Diablo Viste de Prada 2',
  description_es = 'La secuela que todas estábamos esperando. Vívela con un grupo de mujeres que aprecian la moda, el drama y una buena copa bien fría. En Ocine Urban Caleido.'
  where id = 'b395fa6b-4406-4d00-84f4-18e4943c5f19';

update public.events set title_es = 'Club de Cocina: Galletas',
  description_es = 'Hornea, prueba y llévate a casa una caja de galletas caseras y nuevas amigas. Una mañana de domingo bien aprovechada. La ubicación se confirma al reservar.'
  where id = '7c94042e-6400-4614-a557-86382204eb7f';

update public.events set title_es = 'Clase de Yoga + Picnic',
  description_es = 'Empieza tu sábado con una sesión de yoga al aire libre en el Parque del Retiro, seguida de un picnic sobre el césped. Esterillas incluidas. Trae tu snack favorito para compartir.'
  where id = '3f241619-7400-489c-b4e6-be94164002c9';

update public.events set title_es = 'Excursión de un Día a Segovia',
  description_es = 'Una preciosa excursión de un día para descubrir Segovia juntas — el icónico acueducto romano, el casco antiguo y una comida tranquila. Transporte incluido desde el centro de Madrid.'
  where id = 'dd8d610d-f0e7-4884-99c9-eb5009b8b3ca';

update public.events set title_es = 'Sesión de Longevidad',
  description_es = 'Mascarilla de luz roja y un Matcha Latte de colágeno.'
  where id = '8cd2660f-679b-4bfc-a9fa-d87cd60499ef';

update public.events set title_es = 'Afterwork de Miembros Fundadoras',
  description_es = 'Encuentro exclusivo de vermut para las miembros fundadoras de Nomaya.'
  where id = '75bcebae-b7e5-4244-8c7d-1054b7b87133';

update public.events set title_es = 'Fin de Semana de Esquí en Sierra Nevada',
  description_es = 'Lánzate a las pistas en un divertido fin de semana entre amigas en Sierra Nevada. Perfecto para esquiadoras principiantes e intermedias. Alojamiento y forfaits incluidos.'
  where id = '8ddffd74-75bf-4c16-bf45-c1c8de1f164e';

update public.events set title_es = 'Retiro de Yoga en la Montaña',
  description_es = 'Un fin de semana para reconectar contigo misma y con la naturaleza. Sesiones diarias de yoga, meditación guiada, comidas nutritivas y la compañía de mujeres maravillosas en la Sierra de Guadarrama.'
  where id = 'a783e29b-9130-49d2-a51a-88dad6dd51a8';

update public.events set title_es = 'Taller de Journaling',
  description_es = 'Un futuro círculo de Nomaya — una sesión guiada de journaling para reflexionar, escribir y conectar.'
  where id = '2f43d713-2405-4f61-9a69-39e22a8afb70';

update public.events set title_es = 'Sesión de Pintura de Cerámica',
  description_es = 'Un futuro círculo de Nomaya — pinta cerámica en una tarde relajada y creativa junto a otras miembros.'
  where id = '4e4ca655-dc0a-4143-9466-ae0c6b84ff6d';

update public.events set title_es = 'Excursión a Caballo de un Día',
  description_es = 'Una mañana mágica montando a caballo por las montañas a las afueras de Madrid. No hace falta experiencia. Transporte incluido desde el centro de Madrid.'
  where id = 'fce47958-f43d-461f-a9e1-38b04112306c';

update public.events set title_es = 'Taller de Matcha',
  description_es = 'Un futuro círculo de Nomaya — aprende el arte del matcha mientras disfrutáis juntas de dulces bocados.'
  where id = '1d693c3e-7db8-4149-80f5-f88a09c9caeb';

-- Verify: this should show 17 rows, all with title_es/description_es filled in
select id, title, title_es from public.events order by date;
