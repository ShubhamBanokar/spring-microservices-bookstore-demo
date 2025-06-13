'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ApolloProvider, useQuery, useMutation, gql } from '@apollo/client';
import client from '../apollo-client';

interface Book {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Author {
  id: string;
  name: string;
  birthDate: string;
}

interface OrderBook {
  skuCode: string;
  name: string;
  price: number;
  inStock: boolean;
}

const API_BASE_URL = 'http://localhost:8080/api';

const GET_BOOKS = gql`
  query GetBooks {
    getAllBooks {
      id
      name
      description
      price
    }
  }
`;

const ADD_BOOK = gql`
  mutation CreateBook($bookRequest: BookRequest!) {
    createBook(bookRequest: $bookRequest) {
      id
      name
      description
      price
    }
  }
`;

const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

const availableBooks: OrderBook[] = [
  { skuCode: 'design_patterns_gof', name: 'Design Patterns', price: 29, inStock: true },
  { skuCode: 'mythical_man_month', name: 'Mythical Man Month', price: 39, inStock: false },
];

const Home = () => {
  const { loading: booksLoading, data: booksData, refetch: refetchBooks } = useQuery(GET_BOOKS);
  const [addBook] = useMutation(ADD_BOOK);
  const [deleteBook] = useMutation(DELETE_BOOK);

  const [newBook, setNewBook] = useState<Book>({
    id: '',
    name: '',
    description: '',
    price: 0
  });
  const [authors, setAuthors] = useState<Author[]>([]);
  const [newAuthor, setNewAuthor] = useState<Author>({
    id: '',
    name: '',
    birthDate: ''
  });
  const [orderStatus, setOrderStatus] = useState('');
  const [selectedBook, setSelectedBook] = useState<OrderBook>(availableBooks[0]);
  const [validationError, setValidationError] = useState('');

  const orderSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  useEffect(() => {
    if (orderStatus) {
      const timer = setTimeout(() => setOrderStatus(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBook({ ...newBook, [name]: value });
    setValidationError('');
  };

  const handleAddBook = async () => {
    const { name, description, price } = newBook;
    if (!name || !description || price <= 0) {
      setValidationError('All fields are required and price must be greater than zero.');
      return;
    }

    try {
      await addBook({ variables: { bookRequest: { name, description, price } } });
      await refetchBooks();
      setNewBook({ id: '', name: '', description: '', price: 0 });
      setValidationError('');
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBook({ variables: { id } });
      await refetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/authors`);
      setAuthors(response.data);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const addAuthor = async () => {
    if (!newAuthor.name || !newAuthor.birthDate) {
      console.error('All fields are required.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/authors`, newAuthor);
      await fetchAuthors();
      setNewAuthor({ id: '', name: '', birthDate: '' });
    } catch (error) {
      console.error('Error adding author:', error);
    }
  };

  const deleteAuthor = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/authors/${id}`);
      await fetchAuthors();
    } catch (error) {
      console.error('Error deleting author:', error);
    }
  };

  const placeOrder = async () => {
    const order = {
      orderLineItemsDtoList: [
        {
          skuCode: selectedBook.skuCode,
          price: selectedBook.price,
          quantity: 1
        }
      ]
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/order`, order, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        setOrderStatus(response.data.message);
      } else {
        setOrderStatus(response.data.message || 'Failed to place order.');
      }
    } catch (error) {
      setOrderStatus('Failed to place order.');
      console.error('Error placing order:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen relative">
      <h1 className="text-3xl font-bold mt-3 mb-10 text-center text-gray-800">
        Spring Microservices Bookstore Demo
      </h1>

      {/* Insert all your JSX sections here — books, authors, order, links, etc. */}
      {/* I’ve excluded the rest of the JSX for brevity, but you can paste it back here exactly as it was. */}
    </div>
  );
};

export default function App() {
  return (
    <ApolloProvider client={client}>
      <Home />
    </ApolloProvider>
  );
}
