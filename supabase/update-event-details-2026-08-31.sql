-- Running Club: time -> 10:00, new description (EN/ES)
UPDATE events SET
  time = '10:00:00',
  description = $en$Start your Saturday with a run & coffee 💜
Meet us at VEIA at 10:00 for an easy 5K social run through Retiro, followed by coffee, matcha or brunch together.
Social pace: around 6:45 min/km. Come solo, meet the girls and run with us 🏃‍♀️☕️.$en$,
  description_es = $es$Empieza tu sábado con una carrera y un café 💜
Nos vemos en VEIA a las 10:00 para una carrera social de 5K por el Retiro, seguida de café, matcha o brunch juntas.
Ritmo social: alrededor de 6:45 min/km. Ven sola, conoce a las chicas y corre con nosotras 🏃‍♀️☕️.$es$
WHERE title = 'Running Club';

-- Pottery Workshop: time -> 19:00, price -> 40€
UPDATE events SET
  time = '19:00:00',
  price_cents = 4000
WHERE title = 'Pottery Workshop';

-- Book Club: price -> 10€, new description (EN/ES)
UPDATE events SET
  price_cents = 1000,
  description = $en$Bring a book you loved and join us for gelato, good conversation and new recommendations. We'll share our picks and, if you're up for it, swap books at the end.
No assigned reading — just bring a book and come meet the girls 💜$en$,
  description_es = $es$Trae un libro que te haya encantado y únete a nosotras para tomar un gelato, buena conversación y nuevas recomendaciones. Compartiremos nuestras elecciones y, si te apetece, intercambiaremos libros al final.
Sin lectura asignada — solo trae un libro y ven a conocer a las chicas 💜$es$
WHERE title = 'Book Club: Gelato Edition';

-- Welcome Back Picnic: time -> 12:00, price -> 15€, new description (EN/ES)
UPDATE events SET
  time = '12:00:00',
  price_cents = 1500,
  description = $en$Back in Madrid? Let's catch up 💜
We're getting the girls together for a laid-back picnic to welcome everyone back after summer — snacks, drinks, good conversations and new people to meet.
Just bring yourself, we'll take care of the rest.$en$,
  description_es = $es$¿De vuelta en Madrid? Pongámonos al día 💜
Reunimos a las chicas para un picnic relajado y dar la bienvenida a todas después del verano — snacks, bebidas, buenas conversaciones y gente nueva por conocer.
Solo trae tus ganas, nosotras nos encargamos del resto.$es$
WHERE title = 'Welcome Back Picnic';

-- Day Trip: Segovia: price -> 40€, new description (EN/ES)
UPDATE events SET
  price_cents = 4000,
  description = $en$We're heading to Segovia for the day, with a stop in Valsaín for an easy scenic hike before exploring the city, having lunch and spending the afternoon together.
Transport & itinerary included. Food and drinks are separate.
Valsaín hike · Segovia · Small group$en$,
  description_es = $es$Nos vamos a Segovia por el día, con una parada en Valsaín para una ruta de senderismo fácil y con buenas vistas, antes de explorar la ciudad, comer y pasar la tarde juntas.
Transporte e itinerario incluidos. Comida y bebida no incluidas.
Ruta por Valsaín · Segovia · Grupo pequeño$es$
WHERE title = 'Day Trip: Segovia';

-- Dinner Club (Madrid only): time -> 20:30, paid at restaurant (not Barcelona's)
UPDATE events SET
  time = '20:30:00',
  price_cents = 0,
  payment_at_venue = true
WHERE title = 'Dinner Club' AND city = 'Madrid';
