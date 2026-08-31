UPDATE events SET
  title = 'Day Trip: Segovia + Hike',
  title_es = 'Excursión de un Día: Segovia + Ruta',
  time = '09:30:00',
  image_url = 'https://jtoftrghfwdffrkqejlq.supabase.co/storage/v1/object/public/Events/segovia-hike.png',
  description = $en$🕤 From 9:30am to 7pm (approx.)
We're heading to Segovia for the day, with a stop in Valsaín for an easy scenic hike before exploring the city, having lunch and spending the afternoon together.
Transport & itinerary included. Food and drinks are separate.
Valsaín hike · Segovia · Small group$en$,
  description_es = $es$🕤 De 9:30 a 19:00 (aprox.)
Nos vamos a Segovia por el día, con una parada en Valsaín para una ruta de senderismo fácil y con buenas vistas, antes de explorar la ciudad, comer y pasar la tarde juntas.
Transporte e itinerario incluidos. Comida y bebida no incluidas.
Ruta por Valsaín · Segovia · Grupo pequeño$es$
WHERE title = 'Day Trip: Segovia';
