// Configuration management
import { GITHUB_OWNER, GITHUB_REPO } from './constants.js';

const TOKEN_KEY = 'pantallita_token';
const USERNAME_KEY = 'pantallita_username';
const REPO_KEY = 'pantallita_repo';

export function loadConfig() {
	const token = localStorage.getItem(TOKEN_KEY) || '';
	const owner = localStorage.getItem(USERNAME_KEY) || GITHUB_OWNER;
	const repo = localStorage.getItem(REPO_KEY) || GITHUB_REPO;
	return {
		token,
		owner,
		repo
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

export function saveCredentials(username, repo, token) {
	localStorage.setItem(USERNAME_KEY, username);
	localStorage.setItem(REPO_KEY, repo);
	localStorage.setItem(TOKEN_KEY, token);
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

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export function clearCredentials() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USERNAME_KEY);
	localStorage.removeItem(REPO_KEY);
}

export function hasToken() {
	const token = getToken();
	return token && token.length > 0;
}
