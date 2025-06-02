import { Link } from 'react-router-dom'

interface NavLink {
  path: string
  label: string
}

interface NavbarProps {
  links: NavLink[]
}

export default function Navbar({ links }: NavbarProps) {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">Gestion Patrimoine</div>
        <ul className="flex space-x-6">
          {links.map(link => (
            <li key={link.path}>
              <Link 
                to={link.path}
                className="hover:text-blue-300 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
