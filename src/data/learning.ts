// Menstrual Health Learning Center + Nutrition content.
// Written in simple, stigma-free language for ages ~8–14.
// Sources consulted for accuracy: NHS (UK) periods guidance, WHO/UNICEF menstrual
// health guidance, US Office on Women's Health. Not a substitute for medical advice.

export type Illustration =
  | 'cycle' | 'calendar' | 'uterus' | 'growing' | 'variety'
  | 'pad' | 'padSteps' | 'tampon' | 'tamponSafe' | 'cup' | 'cupCare' | 'cloth' | 'clothCare'
  | 'clock' | 'shower' | 'bin' | 'sun' | 'kit' | 'talk'
  | 'myth' | 'plate' | 'fruitveg' | 'protein' | 'bones' | 'water' | 'habits';

export interface Topic {
  id: string;
  title: string;
  art: Illustration;
  body: string[];
}

export interface Myth {
  id: string;
  myth: string;
  fact: string;
}

export interface Section {
  id: string;
  letter: string;
  title: string;
  blurb: string;
  color: string;
  topics?: Topic[];
  myths?: Myth[];
}

export const LEARNING_SECTIONS: Section[] = [
  {
    id: 'periods', letter: 'A', title: 'Understanding Periods', color: '#C66161',
    blurb: 'What periods are and why they happen.',
    topics: [
      { id: 'what', title: 'What is menstruation?', art: 'uterus', body: [
        'Menstruation — also called a period — is when blood and tissue from the lining of the uterus (womb) leaves the body through the vagina.',
        'A period usually lasts about 2 to 7 days. It is a normal, healthy part of growing up.',
      ] },
      { id: 'why', title: 'Why do periods happen?', art: 'cycle', body: [
        'Each month, the uterus builds up a soft, thick lining, in case it is needed to support a pregnancy when someone is grown up.',
        'When it is not needed, the body sheds the lining. That is a period. Hormones — the body\'s chemical messengers — control this.',
      ] },
      { id: 'cycle', title: 'What happens in a menstrual cycle?', art: 'calendar', body: [
        'A cycle is counted from the first day of one period to the first day of the next.',
        'It is often around 28 days, but anywhere from about 21 to 45 days is common for young people.',
        'During the cycle, an ovary releases a tiny egg and the lining of the uterus grows. If the lining is not needed, the next period begins.',
      ] },
      { id: 'when', title: 'When do periods usually begin?', art: 'growing', body: [
        'Most girls get their first period between the ages of 10 and 15, though anywhere from about 8 to 16 can be normal.',
        'It often comes around two years after breasts start to develop. These changes come to every girl in her own time.',
      ] },
      { id: 'different', title: 'Why is every cycle different?', art: 'variety', body: [
        'Every body is different! The length of the cycle, how many days bleeding lasts and how heavy it is can all vary.',
        'In the first year or two, periods are often irregular. That is normal. If you are worried about anything, talk to a trusted adult or a doctor.',
      ] },
    ],
  },
  {
    id: 'products', letter: 'B', title: 'Menstrual Products', color: '#3F6E68',
    blurb: 'Pads, tampons, cups and cloth pads — all safe options.',
    topics: [
      { id: 'pads', title: 'What are sanitary pads?', art: 'pad', body: [
        'A sanitary pad is a soft, absorbent pad that sticks to the inside of your underwear and soaks up period blood.',
        'Pads come in different sizes — thinner for lighter days, longer for heavier days and night-time.',
      ] },
      { id: 'padsUse', title: 'Using and changing pads', art: 'padSteps', body: [
        '1. Wash your hands. 2. Peel off the backing and stick the pad to the middle of your underwear. 3. Change it every 4 to 6 hours, or sooner if it feels full — follow your flow and the pack instructions.',
        'Wrap the used pad in its wrapper or some paper and put it in a covered bin. Then wash your hands again.',
      ] },
      { id: 'tampons', title: 'What are tampons?', art: 'tampon', body: [
        'A tampon is a small plug of soft, absorbent material that is placed inside the vagina to absorb blood. It has a string for removing it.',
        'Tampons are one of several choices. Nobody has to use them — you can decide what feels right, with help from a trusted adult.',
      ] },
      { id: 'tamponsSafe', title: 'Using tampons safely', art: 'tamponSafe', body: [
        'Wash your hands before and after. Use the lowest absorbency you need and read the instructions in the pack.',
        'Change a tampon every 4 to 8 hours — never leave one in for more than 8 hours. This helps prevent a rare but serious illness called Toxic Shock Syndrome (TSS).',
      ] },
      { id: 'cups', title: 'What are menstrual cups?', art: 'cup', body: [
        'A menstrual cup is a small, flexible cup made of medical-grade silicone. It is folded and placed inside the vagina, where it collects blood instead of absorbing it.',
        'With good care, one cup can be reused for several years.',
      ] },
      { id: 'cupsCare', title: 'Looking after a menstrual cup', art: 'cupCare', body: [
        'Always wash your hands first. Empty, rinse and reinsert the cup as often as the instructions say (often up to every 8–12 hours).',
        'At the end of each period, boil it in clean water to sterilise it, let it dry, and store it in a breathable cloth pouch.',
      ] },
      { id: 'cloth', title: 'What are reusable cloth pads?', art: 'cloth', body: [
        'Reusable cloth pads are made of soft layers of absorbent fabric. They are washed and used again.',
        'They are a safe, low-waste option when they are kept clean and dry.',
      ] },
      { id: 'clothCare', title: 'Washing and drying cloth pads', art: 'clothCare', body: [
        'Rinse in cold water first, then wash well with soap and clean water.',
        'Dry them completely, ideally in direct sunlight — sunlight helps kill germs. Don\'t hide them to dry in damp, dark places. Store them only when fully dry, in a clean bag or box.',
      ] },
    ],
  },
  {
    id: 'hygiene', letter: 'C', title: 'Hygiene & Safety', color: '#2F4A73',
    blurb: 'Simple habits that keep you comfortable and healthy.',
    topics: [
      { id: 'change', title: 'Changing products regularly', art: 'clock', body: [
        'Change pads every 4–6 hours, tampons within 8 hours, and empty cups as the instructions say.',
        'Changing regularly keeps you comfortable and helps prevent rashes and infections.',
      ] },
      { id: 'personal', title: 'Personal hygiene', art: 'shower', body: [
        'Bathing during your period is completely safe and helps you feel fresh.',
        'Wash the outside of your genital area with clean water every day, and wipe from front to back. The vagina cleans itself — no special washes are needed. Wear clean, comfortable cotton underwear.',
      ] },
      { id: 'disposal', title: 'Safe disposal of pads', art: 'bin', body: [
        'Wrap used disposable pads in their wrapper, newspaper or a disposal bag, then put them in a covered dustbin.',
        'Never flush pads or tampons down the toilet, and never throw them in the open. Wash your hands afterwards.',
      ] },
      { id: 'reusable', title: 'Cleaning reusable products', art: 'sun', body: [
        'Cloth pads: rinse, wash with soap, and dry fully in sunlight. Cups: rinse during your period and boil between periods.',
        'Never store a reusable product while it is still damp.',
      ] },
      { id: 'dry', title: 'Keeping products clean and dry', art: 'kit', body: [
        'Keep unused products in their packets in a clean, dry place — not in a damp bathroom corner.',
        'A small period kit in your school bag (pads, clean underwear, tissues and a disposal bag) helps you feel prepared.',
      ] },
      { id: 'adult', title: 'When to ask a trusted adult', art: 'talk', body: [
        'Talk to a parent, aunt, teacher, school nurse or doctor if: bleeding soaks a pad in an hour or two, a period lasts more than 7 days, pain stops you from doing everyday things, you feel very dizzy or weak, or you have not had a period by about 15 or 16.',
        'And any time you have a question — asking is always okay!',
      ] },
    ],
  },
  {
    id: 'myths', letter: 'D', title: 'Myths & Facts', color: '#B8643F',
    blurb: 'Let\'s bust some common myths.',
    myths: [
      { id: 'dirty', myth: 'Periods are dirty.',
        fact: 'Periods are a natural biological process. Menstrual blood is not dirty.' },
      { id: 'sports', myth: 'Girls cannot play sports during periods.',
        fact: 'Physical activity is generally safe during menstruation, and many girls continue their normal activities. Exercise can even ease cramps.' },
      { id: 'same', myth: 'All girls have the same menstrual cycle.',
        fact: 'Menstrual cycles can vary from person to person.' },
      { id: 'bath', myth: 'You should not bathe or wash your hair during your period.',
        fact: 'Bathing is safe and helps you feel clean and comfortable.' },
      { id: 'kitchen', myth: 'Girls on their period should stay out of the kitchen or away from others.',
        fact: 'Periods do not make anyone impure. You can cook, eat, play and do everything as usual.' },
      { id: 'secret', myth: 'Periods are something to hide or be ashamed of.',
        fact: 'Periods are normal. Talking openly helps everyone learn and support each other.' },
      { id: 'oneProduct', myth: 'There is only one right product to use.',
        fact: 'Pads, tampons, cups and cloth pads are all options. Choose what is comfortable for you.' },
    ],
  },
  {
    id: 'nutrition', letter: 'E', title: 'Nutrition', color: '#7E9A6E',
    blurb: 'Food that fuels your growing body.',
    topics: [
      { id: 'balanced', title: 'Balanced nutrition', art: 'plate', body: [
        'A balanced plate has fruits and vegetables, grains like rice or roti, protein like dal, eggs or paneer, and milk or curd.',
        'Eating a variety of foods gives your growing body everything it needs.',
      ] },
      { id: 'fv', title: 'Fruits and vegetables', art: 'fruitveg', body: [
        'Try to eat a rainbow! Different colours give you different vitamins, minerals and fibre.',
      ] },
      { id: 'protein', title: 'Protein', art: 'protein', body: [
        'Protein helps build and repair muscles and other tissues.',
        'You can find it in dal, beans, chana, eggs, milk, paneer, nuts, fish and meat.',
      ] },
      { id: 'calcium', title: 'Calcium and iron', art: 'bones', body: [
        'Calcium (milk, curd, ragi, leafy greens) builds strong bones and teeth.',
        'Iron (spinach, beans, dal, eggs, meat) helps your blood carry oxygen. Your body loses some iron during periods, so iron-rich foods matter. Vitamin C foods like oranges help your body absorb iron.',
      ] },
      { id: 'hydration', title: 'Hydration', art: 'water', body: [
        'Drink water through the day, especially when you are active or it is hot.',
        'Water helps your body work well and can help with tiredness and headaches.',
      ] },
      { id: 'habits', title: 'Healthy eating habits', art: 'habits', body: [
        'Eat breakfast, enjoy treats now and then, eat when you are hungry and stop when you are full.',
        'Sharing meals with family is a lovely healthy habit too.',
      ] },
    ],
  },
];

export const DISCLAIMER =
  'POWER DASH is for learning. It is not medical advice. If you have questions about your health, talk to a trusted adult or a healthcare professional.';
