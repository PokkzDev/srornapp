'use client'

import { forwardRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import { getMonth, getYear } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'

// Registrar locale español
registerLocale('es', es)

// Nombres de meses en español
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Generar rango de años (desde 1900 hasta el año actual + 10)
const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => 1900 + i)

// Estilos para el header personalizado
const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px',
  gap: '8px'
}

const buttonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
  fontSize: '18px',
  color: '#216ba5',
  fontWeight: 'bold'
}

const selectStyle = {
  padding: '4px 8px',
  border: '1px solid #d7e2eb',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: '#fff',
  color: '#0f172a',
  cursor: 'pointer'
}

const monthSelectStyle = {
  ...selectStyle,
  minWidth: '110px'
}

const yearSelectStyle = {
  ...selectStyle,
  minWidth: '70px'
}

// Función para renderizar el header personalizado
const renderCustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled
}) => (
  <div style={headerStyle}>
    <button
      type="button"
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
      style={{ ...buttonStyle, opacity: prevMonthButtonDisabled ? 0.5 : 1 }}
    >
      {'<'}
    </button>
    
    <div style={{ display: 'flex', gap: '8px' }}>
      <select
        value={getMonth(date)}
        onChange={({ target: { value } }) => changeMonth(Number(value))}
        style={monthSelectStyle}
      >
        {meses.map((mes, i) => (
          <option key={mes} value={i}>
            {mes}
          </option>
        ))}
      </select>
      
      <select
        value={getYear(date)}
        onChange={({ target: { value } }) => changeYear(Number(value))}
        style={yearSelectStyle}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
    
    <button
      type="button"
      onClick={increaseMonth}
      disabled={nextMonthButtonDisabled}
      style={{ ...buttonStyle, opacity: nextMonthButtonDisabled ? 0.5 : 1 }}
    >
      {'>'}
    </button>
  </div>
)

/**
 * Componente DateTimePicker reutilizable
 * Muestra calendario y selector de hora separados (hora, minutos, segundos)
 */
const DateTimePicker = forwardRef(function DateTimePicker({
  selected,
  onChange,
  showTimeSelect = true,
  showTimeSelectOnly = false,
  timeIntervals = 1,
  dateFormat = 'dd/MM/yyyy HH:mm',
  timeCaption = 'Hora',
  placeholderText = 'Seleccione fecha y hora',
  maxDate = new Date(),
  minDate = null,
  required = false,
  disabled = false,
  showSeconds = false,
  className = '',
  id,
  name,
  dateOnly = false,
  ...props
}, ref) {
  // Si es solo fecha, desactivar tiempo
  if (dateOnly) {
    return (
      <DatePicker
        ref={ref}
        selected={selected}
        onChange={onChange}
        showTimeSelect={false}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholderText || 'Seleccione fecha'}
        maxDate={maxDate}
        minDate={minDate}
        required={required}
        disabled={disabled}
        locale="es"
        showPopperArrow={false}
        renderCustomHeader={renderCustomHeader}
        id={id}
        name={name}
        className={className}
        autoComplete="off"
        isClearable
        {...props}
      />
    )
  }

  // Ajustar formato si se muestran segundos
  const finalDateFormat = showSeconds ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy HH:mm'

  // Custom time input para segundos
  const CustomTimeInput = ({ value, onChange: onTimeChange }) => {
    // Obtener tiempo directamente de la fecha seleccionada para evitar problemas de sincronización
    const getTimeFromSelected = () => {
      if (!selected) return { hours: '00', minutes: '00', seconds: '00' }
      return {
        hours: selected.getHours().toString().padStart(2, '0'),
        minutes: selected.getMinutes().toString().padStart(2, '0'),
        seconds: selected.getSeconds().toString().padStart(2, '0')
      }
    }

    const time = getTimeFromSelected()

    const handleChange = (field, newValue) => {
      const newTime = { ...time, [field]: newValue.padStart(2, '0') }
      // Crear una nueva fecha con el tiempo actualizado
      const baseDate = selected || new Date()
      const newDate = new Date(baseDate)
      newDate.setHours(parseInt(newTime.hours, 10))
      newDate.setMinutes(parseInt(newTime.minutes, 10))
      newDate.setSeconds(parseInt(newTime.seconds, 10))
      // Llamar al onChange principal del DatePicker con la fecha completa
      onChange(newDate)
    }

    const timeSelectStyle = {
      padding: '4px 8px',
      border: '1px solid #d7e2eb',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: '#fff',
      color: '#0f172a',
      cursor: 'pointer'
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px' }}>
        <select
          value={time.hours}
          onChange={(e) => handleChange('hours', e.target.value)}
          style={timeSelectStyle}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i.toString().padStart(2, '0')}>
              {i.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        <span style={{ fontWeight: 'bold' }}>:</span>
        <select
          value={time.minutes}
          onChange={(e) => handleChange('minutes', e.target.value)}
          style={timeSelectStyle}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i.toString().padStart(2, '0')}>
              {i.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        <span style={{ fontWeight: 'bold' }}>:</span>
        <select
          value={time.seconds}
          onChange={(e) => handleChange('seconds', e.target.value)}
          style={timeSelectStyle}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i.toString().padStart(2, '0')}>
              {i.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (showSeconds) {
    return (
      <DatePicker
        ref={ref}
        selected={selected}
        onChange={onChange}
        showTimeSelect={false}
        showTimeInput
        customTimeInput={<CustomTimeInput />}
        timeFormat="HH:mm:ss"
        timeIntervals={timeIntervals}
        timeCaption={timeCaption}
        dateFormat={finalDateFormat}
        placeholderText={placeholderText}
        maxDate={maxDate}
        minDate={minDate}
        renderCustomHeader={renderCustomHeader}
        required={required}
        disabled={disabled}
        locale="es"
        showPopperArrow={false}
        id={id}
        name={name}
        className={className}
        autoComplete="off"
        isClearable
        {...props}
      />
    )
  }

  return (
    <DatePicker
      ref={ref}
      selected={selected}
      onChange={onChange}
      showTimeSelect={showTimeSelect}
      showTimeSelectOnly={showTimeSelectOnly}
      timeFormat="HH:mm"
      timeIntervals={timeIntervals}
      timeCaption={timeCaption}
      dateFormat={finalDateFormat}
      placeholderText={placeholderText}
      maxDate={maxDate}
      minDate={minDate}
      required={required}
      disabled={disabled}
      locale="es"
      showPopperArrow={false}
      renderCustomHeader={renderCustomHeader}
      id={id}
      name={name}
      className={className}
      autoComplete="off"
      isClearable
      {...props}
    />
  )
})

export default DateTimePicker
