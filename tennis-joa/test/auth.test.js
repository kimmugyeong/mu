import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateUser, saveUser, validateSignupInput } from '../lib/auth.js';

const originalWindow = globalThis.window;

test.beforeEach(() => {
  globalThis.window = {
    localStorage: {
      store: new Map(),
      getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
      },
      setItem(key, value) {
        this.store.set(key, value);
      },
      removeItem(key) {
        this.store.delete(key);
      },
    },
  };
});

test.afterEach(() => {
  globalThis.window = originalWindow;
});

test('회원가입 입력이 올바르면 오류가 없다', () => {
  const errors = validateSignupInput({
    name: '홍길동',
    username: 'hong123',
    password: 'password123',
  });

  assert.deepEqual(errors, {});
});

test('중복 아이디는 에러를 반환한다', () => {
  saveUser({
    name: '홍길동',
    username: 'hong123',
    password: 'password123',
  });

  const errors = validateSignupInput({
    name: '김철수',
    username: 'hong123',
    password: 'password123',
  });

  assert.equal(errors.username, '이미 사용 중인 아이디입니다.');
});

test('저장된 사용자는 아이디로 로그인할 수 있다', () => {
  saveUser({
    name: '홍길동',
    username: 'hong123',
    password: 'password123',
  });

  const user = authenticateUser('hong123', 'password123');

  assert.ok(user);
  assert.equal(user.name, '홍길동');
});
