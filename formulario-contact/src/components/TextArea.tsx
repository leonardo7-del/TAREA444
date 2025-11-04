import React, { useState, useEffect } from 'react';

interface TextAreaProps {
  label: string;
  name: string;
  register: any;
  error?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  watch?: any;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  name,
  register,
  error,
  placeholder,
  rows = 4,
  maxLength,
  required = false,
  watch,
}) => {
  const id = `field-${name}`;
  const [charCount, setCharCount] = useState(0);
  
  // Si se proporciona la función watch, actualizar el contador de caracteres
  useEffect(() => {
    if (watch) {
      const subscription = watch((value: any) => {
        if (value[name]) {
          setCharCount(value[name].length);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, name]);
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      />
      <div className="flex justify-between mt-1 text-sm">
        {error && (
          <p id={`${id}-error`} className="text-red-500">
            {error}
          </p>
        )}
        {maxLength && (
          <p className={`text-right ${charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextArea;