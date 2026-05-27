import { useState } from 'react'

import Pagination from './Pagination'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Pagination> = {
  title: 'Common/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Pagination>

function PaginationDemo({
  totalPages,
  initialPage = 1,
  siblingCount,
}: {
  totalPages: number
  initialPage?: number
  siblingCount?: number
}) {
  const [page, setPage] = useState(initialPage)
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      siblingCount={siblingCount}
    />
  )
}

export const Default: Story = {
  render: () => <PaginationDemo totalPages={10} />,
}

export const FirstPage: Story = {
  render: () => <PaginationDemo totalPages={10} initialPage={1} />,
}

export const MiddlePage: Story = {
  render: () => <PaginationDemo totalPages={20} initialPage={10} />,
}

export const LastPage: Story = {
  render: () => <PaginationDemo totalPages={10} initialPage={10} />,
}

export const FewPages: Story = {
  render: () => <PaginationDemo totalPages={3} />,
}

export const ManyPages: Story = {
  render: () => <PaginationDemo totalPages={100} initialPage={50} />,
}

export const LargerSiblingCount: Story = {
  render: () => <PaginationDemo totalPages={20} initialPage={10} siblingCount={3} />,
}
