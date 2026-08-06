export function validateClubInput(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = '클럽 이름을 입력해주세요.';
  }

  if (!values.address?.trim()) {
    errors.address = '주소를 입력해주세요.';
  }

  if (!values.city?.trim()) {
    errors.city = '도시를 입력해주세요.';
  }

  if (!values.description?.trim()) {
    errors.description = '클럽 소개를 입력해주세요.';
  }

  if (values.contactPhone && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(values.contactPhone)) {
    errors.contactPhone = '올바른 연락처 형식이 아닙니다.';
  }

  if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) {
    errors.contactEmail = '올바른 이메일 형식이 아닙니다.';
  }

  return errors;
}
