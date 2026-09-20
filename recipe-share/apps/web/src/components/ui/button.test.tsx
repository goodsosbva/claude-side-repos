import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

// React Testing Library 사용 예시를 겸한다.
// 원칙: 구현(클래스명, 내부 state)이 아니라 사용자가 보는 것(role, 텍스트)으로 찾는다.
// 아래 variant 테스트만 예외적으로 클래스를 본다 — 그것이 variant 의 유일한 관측 가능한 결과라서다.
describe('<Button />', () => {
  it('자식을 렌더링하고 기본 type 은 button 이다', () => {
    render(<Button>저장</Button>);

    const button = screen.getByRole('button', { name: '저장' });

    expect(button).toBeInTheDocument();
    // form 안에서 의도치 않게 submit 되지 않도록 하는 방어. 깨지면 조용히 버그가 된다.
    expect(button).toHaveAttribute('type', 'button');
  });

  it('variant 에 따라 스타일이 바뀐다', () => {
    render(<Button variant="destructive">삭제</Button>);

    expect(screen.getByRole('button', { name: '삭제' })).toHaveClass('bg-red-600');
  });

  it('클릭하면 핸들러가 호출된다', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>확인</Button>);

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 면 클릭이 먹지 않는다', async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        확인
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
