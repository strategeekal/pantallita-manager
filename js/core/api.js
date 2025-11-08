// GitHub API utilities
import { loadConfig } from './config.js';

export async function fetchGitHubFile(path) {
	const config = loadConfig();
	const timestamp = new Date().getTime();
	const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?nocache=${timestamp}`;

	const response = await fetch(apiUrl, {
		headers: {
			'Authorization': `Bearer ${config.token}`,
			'Accept': 'application/vnd.github.v3+json'
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	const data = await response.json();

	// Decode content directly from API response to avoid CDN caching
	const content = decodeURIComponent(escape(atob(data.content)));

	return { content, sha: data.sha, data };
}

export async function saveGitHubFile(path, content, sha = null) {
	const config = loadConfig();
	const encodedContent = btoa(unescape(encodeURIComponent(content)));

	// Get SHA if not provided
	if (!sha) {
		try {
			const getResponse = await fetch(
				`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
				{
					headers: {
						'Authorization': `Bearer ${config.token}`,
						'Accept': 'application/vnd.github.v3+json'
					}
				}
			);

			if (getResponse.ok) {
				const getData = await getResponse.json();
				sha = getData.sha;
			}
		} catch (e) {
			// File doesn't exist yet, will create new
		}
	}

	const response = await fetch(
		`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
		{
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: `Update ${path}`,
				content: encodedContent,
				sha: sha
			})
		}
	);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

export async function deleteGitHubFile(path, sha) {
	const config = loadConfig();

	const response = await fetch(
		`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
		{
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: `Delete ${path}`,
				sha: sha
			})
		}
	);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

export async function listGitHubDirectory(path) {
	const config = loadConfig();
	const timestamp = new Date().getTime();

	const response = await fetch(
		`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?nocache=${timestamp}`,
		{
			headers: {
				'Authorization': `Bearer ${config.token}`,
				'Accept': 'application/vnd.github.v3+json'
			}
		}
	);

	if (!response.ok) {
		if (response.status === 404) {
			return [];
		}
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}
