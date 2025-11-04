import React from 'react';

interface TextFieldProps {
  label: string;
  name: string;
  register: any;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  register,
  error,
  placeholder,
  type = 'text',
  required = false,
}) => {
  const id = `field-${name}`;
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;