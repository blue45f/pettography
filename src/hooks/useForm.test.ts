import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import useForm from './useForm'

describe('useForm', () => {
  const initialValues = { name: '', email: '' }

  it('초기값을 반환한다', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('handleChange로 값을 업데이트한다', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: '홍길동', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.values.name).toBe('홍길동')
  })

  it('setFieldValue로 특정 필드를 업데이트한다', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))

    act(() => {
      result.current.setFieldValue('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
  })

  it('reset으로 초기값으로 되돌린다', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))

    act(() => {
      result.current.setFieldValue('name', '홍길동')
    })
    expect(result.current.values.name).toBe('홍길동')

    act(() => {
      result.current.reset()
    })
    expect(result.current.values).toEqual(initialValues)
  })

  it('handleBlur에서 유효성 검사를 실행한다', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        rules: {
          name: [
            {
              validate: (v) => typeof v === 'string' && v.length > 0,
              message: '이름을 입력하세요',
            },
          ],
        },
        onSubmit: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleBlur({
        target: { name: 'name' },
      } as React.ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.errors.name).toBe('이름을 입력하세요')
  })

  it('유효성 검사 실패 시 onSubmit을 호출하지 않는다', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        rules: {
          name: [{ validate: (v) => typeof v === 'string' && v.length > 0, message: '필수' }],
        },
        onSubmit,
      }),
    )

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>)
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.name).toBe('필수')
  })

  it('setFieldError로 에러를 직접 설정한다', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))

    act(() => {
      result.current.setFieldError('email', '서버 에러')
    })

    expect(result.current.errors.email).toBe('서버 에러')
  })
})
