import List from '@material-ui/core/List';

import City from './City';

const CITIES = [
  {
    name: 'Franklin, Wisconsin',
    link: 'https://www.crwflags.com/fotw/flags/us-wifra.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-wifra.gif',
    facts: [
      'Known in the 1950s as the "city of homes"',
      'Local forest that the town was surrounded by before expansion consisted of hardwoods including hickory, walnut, and butternut',
      'The name "Franklin" was given in honour of Benjamin Franklin',
    ],
  },
  {
    name: 'Gardner, Kansas',
    link: 'https://www.crwflags.com/fotw/flags/us-ksgar.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ksgar.gif',
    facts: [
      'Founded where the Santa Fe Trail and the Oregon/California Trails divided',
      'Originally settled by opponents of slavery in the "Free-Stater" movement who migrated to the area, mostly from Massachusetts',
      'Named for Henry Gardner, then governor of Massachusetts',
    ],
  },
  {
    name: 'Coal Valley Township, Illinois',
    link: 'https://www.crwflags.com/fotw/flags/us-ilcvt.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ilcvt.gif',
    facts: ['Located in Rock Island county', 'Named for the local coal mines', 'Founded in 1856'],
  },
  {
    name: 'Westfield, Massachusetts',
    link: 'https://www.crwflags.com/fotw/flags/us-mawfd.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-mawfd.gif',
    facts: [
      'Originally inhabited by the Pocomtuc, then called Woronoco, meaning "the winding land"',
      'Became the first city in New England to elect a female Mayor in 1939',
      'Was going to be called "Streamfield" because much of the city was between the Westfield River and the Little River',
    ],
  },
  {
    name: 'Covington, Washington',
    link: 'https://www.crwflags.com/fotw/flags/us-wacov.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-wacov2.gif',
    facts: [
      'Previously known as Jenkins Prairie',
      'Named for Richard Covington, a surveyor for Northern Pacific Railroad from Fort Vancouver',
      'Located in King County',
    ],
  },
  {
    name: 'Spring Hill, Kansas',
    link: 'https://www.crwflags.com/fotw/flags/us-kssph.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-kssph2.gif',
    facts: [
      'Founded by one James B. Hovey in 1857 ""Being somewhat enthusiastic in my estimation of its future, it having all advantages of timber and water, and on a line that must be traveled between Olathe and Paola, I concluded to myself, as there was no one else to conclude with, that this was a good place for a town."',
      'Was the home of the first female doctor in Kansas in 1859',
      'In the 1870s the city was struck by a devastating plague of grasshoppers',
    ],
  },
  {
    name: 'Republic, Missouri',
    link: 'https://upload.wikimedia.org/wikipedia/en/c/cd/City_of_Republic%2C_Missouri_flag.png',
    image: 'https://upload.wikimedia.org/wikipedia/en/c/cd/City_of_Republic%2C_Missouri_flag.png',
    facts: [
      'Founded and grew as the result of railway deployment and expansion',
      'Eventually subsumed the nearby village of Brookline, however they had special agreements to keep signage marking where Brookline was',
      'Located across Christian and Greene counties',
    ],
  },
  {
    name: 'Miami Township, Clermont County, Ohio',
    link: 'https://www.crwflags.com/fotw/flags/us-ohcmc.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ohcmc-w.gif',
    facts: [
      "Founded in 1801 as O'Bannon Township, named for the first surveyor of the area",
      "Clermont's name comes from the the French home of Celtic leader Vercingetorix who led the unified Gallic resistance to Roman invasion",
      'Names for the Little Miami river',
    ],
  },
  {
    name: 'Azle, Texas',
    link: 'https://www.crwflags.com/fotw/flags/us-txazl.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-txazl.gif',
    facts: [
      'Named for James Azle Steward, a doctor who moved to the area in 1846',
      'Home to the Azle Marching Green Pride band',
      'Located in Tarrant county, which is named for Edward H. Tarrant of the Republic of Texas militia',
    ],
  },
  {
    name: 'Odessa, Texas',
    link: 'https://www.fotw.info/flags/us-txode.html',
    image: 'https://www.fotw.info/images/u/us-txode3.gif',
    facts: [
      "Supposedly named after Odesa, Ukraine, because of the local shortgrass prairie's resemblance to Ukraine's steppe landscape",
      'There are 38 statues of Jamboree Jackrabbits across the city',
      'The town features a replica of Stonehenge',
    ],
  },
  {
    name: 'Holly Springs, Mississippi',
    link: 'https://www.crwflags.com/fotw/flags/us-mshls.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-mshls.gif',
    facts: [
      'Founded in 1836 on territory occupied by Chickasaw Indians',
      "Home of Mississippi's oldest university",
      'County seat of Marshall County',
    ],
  },
  {
    name: 'Richmond Heights, Missouri',
    link: 'https://www.crwflags.com/fotw/flags/us-morih.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-morih.gif',
    facts: [
      'Located in  St. Louis County',
      'Its name was suggested by Robert E. Lee, who thought the topography of the area resembled Richmond, Virginia',
      "The 1904 World's Fair was key to the development of enough homes for the broader population",
    ],
  },
  {
    name: 'Richfield, Minnesota',
    link: 'https://www.crwflags.com/fotw/flags/us-mnrfd.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-mnrfd.jpg',
    facts: [
      'Located in Hennepin County',
      "Best Buy, the U.S.'s largest electronics retailer, is headquartered in Richfield",
      'Emerged from settlements surrounding Fort Snelling',
    ],
  },
  {
    name: 'Woodland, Mississippi',
    link: 'https://en.wikipedia.org/wiki/Woodland,_Mississippi#/media/File:Flag_of_Woodland,_Mississippi.svg',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/7/72/Flag_of_Woodland%2C_Mississippi.svg',
    facts: [
      'Officially a village in Chickasaw County',
      'Over one million lights are used in the Christmas decorations every year, despite there being a population of barely 150 people',
      'Woodland won the Title of Best Small Town in MS from the State Municipal Association in 2012',
    ],
  },
  {
    name: 'Oolitic, Indiana',
    link: 'https://www.crwflags.com/fotw/flags/us-inool.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-inool.gif',
    facts: [
      'Spread across the Indian Creek and Shawswick townships, Lawrence County',
      'Oolitic was platted on March 23, 1896, by the Bedford Quarries Company',
      'The Town is named after a common type of limestone found in Indianna, called Oolite',
    ],
  },
  {
    name: 'Ballwin, Missouri',
    link: 'https://s3.amazonaws.com/ClubExpressClubFiles/622278/graphics/Ballwin_MO_1759425069.png',
    image:
      'https://s3.amazonaws.com/ClubExpressClubFiles/622278/graphics/Ballwin_MO_1759425069.png',
    facts: [
      'Located in St. Louis County',
      'Founded by John Ball, a second generation Irish immigrant, who owned land adjacent to Manchester Road, a postal route between St Louis and Jefferson city',
      'The town was going to be named "ballshow" but wanted to be called "Ballwin" as a reference to a rivalry with nearby Manchester',
    ],
  },
  {
    name: 'Balch Springs, Texas',
    link: 'https://www.crwflags.com/fotw/flags/us-txbsp.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-txbsp.gif',
    facts: [
      'Located in Dallas County',
      'Part of the Dallas–Fort Worth metroplex.',
      'When the city was incorporated to avoid annexation by Dallas, it subsumed the following communities -  Balch Springs, Zipp City, Five Points, Jonesville, and Triangle',
    ],
  },
  {
    name: 'Springfield Township, Illinois',
    link: 'https://www.crwflags.com/fotw/flags/us-ilspt.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ilspt.gif',
    facts: [
      'Located in Sangamon County',
      'Organised in 1861',
      'It is bounded on the north by Fancy Creek, south by Woodside, east by Clear Lake and west by Gardner townships',
    ],
  },
  {
    name: 'Caldwell, Idaho',
    link: 'https://www.crwflags.com/fotw/flags/us-idcdw.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-idcdw-v.gif',
    facts: [
      'Located in Canyon County',
      'Nicknamed "The Treasure of the Valley"',
      'Heavily impacted by the Oregon Trail and the discovery of Gold',
    ],
  },
  {
    name: 'Pontotoc, Mississippi',
    link: 'https://www.crwflags.com/fotw/flags/us-ms-po.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ms-po.gif',
    facts: [
      'Pontotoc is a Chickasaw word meaning "Land of Hanging Grapes"',
      'The myth of The Wedding of Ortez and SaOwana - Christmas 1540 is considered an important local element',
      'The Maclura pomifera tree (Osage orange) is said to be an important local symbol',
    ],
  },
  {
    name: 'Belle Glade, Florida',
    link: 'https://www.crwflags.com/fotw/flags/us-flblg.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-flbgl.jpg',
    facts: [
      'Located in the western region of Palm Beach County, Florida',
      'Sometimes referred to as "Muck City" due to the large quantity of muck, in which sugarcane grows, found in the area',
      'Sugar cane and vegetable farming are major industries',
    ],
  },
  {
    name: 'Nitro, West Virginia',
    link: 'https://vexillology.fandom.com/wiki/Nitro,_West_Virginia',
    image:
      'https://static.wikia.nocookie.net/vexillology/images/7/77/Flag_of_Nitro%2C_West_Virginia.png',
    facts: [
      'City located in Kanawha and Putnam counties',
      'Named for nitrocellulose, the main ingredient in smokeless gunpowder, because the city was home to major ammunition production facilities during WW1',
      'The city is known as "a Living Memorial to World War I"',
    ],
  },
  {
    name: 'Overland Park, Kansas',
    link: 'https://www.crwflags.com/fotw/flags/us-ksovp.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-ksovp1.gif',
    facts: [
      'Located in Johnson county',
      'Originally founded along an old military roadway',
      'Second largest city in Kansas by population',
    ],
  },
  {
    name: 'Westhampton, Massachusetts',
    link: 'https://www.crwflags.com/fotw/flags/us-mawth.html',
    image: 'https://www.crwflags.com/fotw/images/u/us-mawth.jpg',
    facts: [
      'Located in Hampshire county',
      'A "Dry" town that prohibits the sale of alcohol',
      "The town's first minister was Reverend Enoch Hale, brother of American spy Nathan Hale",
    ],
  },
  {
    name: 'Ranger, Texas',
    link: 'https://www.fotw.info/flags/us-txran.html',
    image: 'https://www.fotw.info/images/u/us-txran.gif',
    facts: [
      'City in Eastland county',
      "Oil, gas, sandstone, and limestone are the industries that lead to the city's founding",
      'Pilot Amelia Earhart landed at the field in 1931 in her Pitcairn Autogyro',
    ],
  },
];

function May23() {
  return (
    <>
      <p>This month, you can both read about the prompt below, or you can watch the video.</p>

      <div
        style={{
          width: '100%',
          height: 0,
          position: 'relative',
          paddingBottom: '56.250%',
        }}
      >
        <iframe
          src="https://streamable.com/e/wwaq2q"
          width="100%"
          height="100%"
          allowfullscreen
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          title="Video prompt"
        />
      </div>

      <p>
        In 2022 the North American Vexillological Association did a survey, and found that
        {' '}
        <a href="https://i.imgur.com/97r74bq.png">
          these were the twenty five worst new (adopted since 2015) village/town/city flags in
          America.
        </a>
      </p>

      <p>
        We want you to redesign these flags. Show the people of these villages, towns, and cities
        that better design is in fact in their grasp.
      </p>

      <p>
        To help you along, here is the list of all the towns, and three useful facts about each one.
      </p>

      <List aria-label="list of cities">
        {CITIES.map((city) => (
          <City key={city.name} city={city} />
        ))}
      </List>
    </>
  );
}

export default May23;
