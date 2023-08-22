import * as cheerio from "cheerio";
import { Profile } from "./types";
import { IGetProfile } from "./types/functions";
import { AxiosScraper } from "./scrapers/axios";
import { PlaywrightScraper } from "./scrapers/playwright";
import { StoriesIGResponse } from "./types/storiesig";
import { extractTagsAndUsers } from "@/utils/text";
import { proxyUrl } from "@/utils/url";

export class StoriesIG implements IGetProfile {
	constructor(private scraper: AxiosScraper | PlaywrightScraper) {}

	async getProfile(username: string): Promise<Profile> {
		let json: StoriesIGResponse;
		const path = `api/ig/userInfoByUsername/${username}`;

		if (this.scraper instanceof AxiosScraper) {
			json = await this.scraper.getJson<StoriesIGResponse>({
				path,
				expireTime: this.scraper.config.ttl?.posts as number,
			});
		} else {
			const html = await this.scraper.getHtml({
				path,
				expireTime: this.scraper.config.ttl?.post as number,
			});
			const $ = cheerio.load(html);
			json = JSON.parse($("pre").text());
		}

		const profile = json.result.user;

		return {
			id: Number(profile.pk),
			username: profile.username,
			fullname: profile.full_name,
			biography: profile.biography,
			...extractTagsAndUsers(profile.biography),
			followers: profile.follower_count,
			following: profile.following_count,
			mediaCount: profile.media_count,
			isPrivate: profile.is_private,
			profilePicture: proxyUrl(profile.profile_pic_url),
			website: profile.external_url,
		};
	}
}