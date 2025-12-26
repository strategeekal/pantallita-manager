// Configuration management
import { GITHUB_OWNER, GITHUB_REPO } from './constants.js';

const TOKEN_KEY = 'pantallita_token';
const USERNAME_KEY = 'pantallita_username';
const REPO_KEY = 'pantallita_repo';
const CTA_API_KEY = 'cta_api_key';

export function loadConfig() {
	const token = localStorage.getItem(TOKEN_KEY) || '';
	const owner = localStorage.getItem(USERNAME_KEY) || GITHUB_OWNER;
	const repo = localStorage.getItem(REPO_KEY) || GITHUB_REPO;
	const ctaApiKey = localStorage.getItem(CTA_API_KEY) || '';
	return {
		token,
		owner,
		repo,
		ctaApiKey
	};
}

export function saveToken(token) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function saveUsername(username) {
	localStorage.setItem(USERNAME_KEY, username);
}

export function saveRepo(repo) {
	localStorage.setItem(REPO_KEY, repo);
}

export function saveCTAApiKey(key) {
	localStorage.setItem(CTA_API_KEY, key);
}

export function saveCredentials(username, repo, token, ctaApiKey) {
	localStorage.setItem(USERNAME_KEY, username);
	localStorage.setItem(REPO_KEY, repo);
	localStorage.setItem(TOKEN_KEY, token);
	if (ctaApiKey) {
		localStorage.setItem(CTA_API_KEY, ctaApiKey);
	}
}

export function getToken() {
	return localStorage.getItem(TOKEN_KEY) || '';
}

export function getUsername() {
	return localStorage.getItem(USERNAME_KEY) || GITHUB_OWNER;
}

export function getRepo() {
	return localStorage.getItem(REPO_KEY) || GITHUB_REPO;
}

export function getCTAApiKey() {
	return localStorage.getItem(CTA_API_KEY) || '';
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export function clearCredentials() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USERNAME_KEY);
	localStorage.removeItem(REPO_KEY);
	localStorage.removeItem(CTA_API_KEY);
}

export function hasToken() {
	const token = getToken();
	return token && token.length > 0;
}

export function hasCTAApiKey() {
	const key = getCTAApiKey();
	return key && key.length > 0;
}
