??? ListItemButton vs ListItemLink vs MenuItemLink... maybe its just the naming that needs fixing
??? When common folder vs component folder?
??? calling useScrollStte position may be more correct than scroll


> useSwrData is a wrapper on the useSwr hook which is used to fetch data. There's 2 reasons for the wrapper: a) the hook can automatically add the reddit auth and refresh tokens to requests, so that logic is centralized in one place, and b) optionally cache the results.
> I used to cache all the results but a very recent change was to only cache results that should be cached
> The only thing that is cached is contest info, to address a scenario where a user opens an entry in a new tab. If there was no caching, the entry tab would fetch the contest data (to get both entry info and navigation), and it could potentially be in a different order, if they then click back on the new tab, the entries would be in a different order which could be confusing if the user is trying to see all the flags in order.
> This may be less of an issue now that there is voting, you probably know if you saw a flag before or not. I'm not sure if this is the best way to solve this particular problem, but I haven't thought of anything better
> I finally removed the caching of other calls because there were too many questions where the answer was "this is due to the front-end cache, wait 10 minutes, refresh and it should pick up new data", so at least now it's just that one call that gets cached