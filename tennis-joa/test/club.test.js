import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClubInput } from '../lib/clubValidation.js';

test('클럽 생성 입력이 올바르면 오류가 없다', () => {
  const errors = validateClubInput({
    name: '테니스 클럽',
    address: '강남구 테헤란로 1',
    city: '서울',
    description: '초보자도 환영합니다.',
    contactPhone: '010-1234-5678',
    contactEmail: 'club@example.com',
  });

  assert.deepEqual(errors, {});
});

test('클럽 이름이 비어 있으면 에러를 반환한다', () => {
  const errors = validateClubInput({
    name: '',
    address: '강남구',
    city: '서울',
    description: '좋은 클럽',
    contactPhone: '',
    contactEmail: '',
  });

  assert.equal(errors.name, '클럽 이름을 입력해주세요.');
});
