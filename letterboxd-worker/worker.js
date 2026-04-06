const LETTERBOXD_RSS = 'https://letterboxd.com/djbevan613/rss/';

function getYearStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

export default {
  async fetch(request) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=43200',
    };

    try {
      const res = await fetch(LETTERBOXD_RSS, {
        headers: { 'User-Agent': 'DJBevan-FilmCounter/1.0' },
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ count: 0, error: 'RSS fetch failed' }), { headers });
      }

      const xml = await res.text();
      const yearStart = getYearStart();

      let count = 0;
      const items = xml.split('<item>').slice(1);

      for (const item of items) {
        const watchedMatch = item.match(/<letterboxd:watchedDate>([^<]+)<\/letterboxd:watchedDate>/);
        const pubMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

        let date = null;
        if (watchedMatch) {
          date = new Date(watchedMatch[1]);
        } else if (pubMatch) {
          date = new Date(pubMatch[1]);
        }

        if (date && date >= yearStart) {
          count++;
        }
      }

      return new Response(JSON.stringify({ count }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ count: 0, error: e.message }), { headers });
    }
  },
};
