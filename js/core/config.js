// Configuration management
import { GITHUB_OWNER, GITHUB_REPO } from './constants.js';

const TOKEN_KEY = 'pantallita_token';

export function loadConfig() {
	const token = localStorage.getItem(TOKEN_KEY) || '';
	return {
		token,
		owner: GITHUB_OWNER,
		repo: GITHUB_REPO
	};
}

export function saveToken(token) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
	return localStorage.getItem(TOKEN_KEY) || '';
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
	const token = getToken();
	return token && token.length > 0;
}
